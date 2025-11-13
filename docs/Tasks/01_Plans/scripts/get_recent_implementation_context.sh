#!/bin/bash

# ==============================================================================
# get_recent_implementation_context.sh
#
# Purpose: Generate optimal git-based context for LLM analysis of recent
#          implementation progress with intelligent token budget management.
#
# Usage: ./get_recent_implementation_context.sh [options]
#
# Options:
#   --days <n>             Days to look back for extended history (default: 30)
#   --max-chars <n>        Character budget (default: 40000)
#   --reference <commit>   Compare against specific commit (default: HEAD)
#   --recent-commits <n>   Number of recent commits for full detail (default: 15, max: 20)
#   --format <type>        Output format: compact|detailed (default: detailed)
#   --help                 Show this help message
#
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Default Configuration
# ------------------------------------------------------------------------------
DAYS=30
MAX_CHARS=40000
REFERENCE="HEAD"
RECENT_COMMITS=15
FORMAT="detailed"

# Character budget allocations (percentages)
BUDGET_CURRENT_STATE=5      # ~2k chars
BUDGET_RECENT_COMMITS=40    # ~16k chars
BUDGET_FILE_HEATMAP=20      # ~8k chars
BUDGET_EXTENDED_HISTORY=25  # ~10k chars
BUDGET_TIMELINE=10          # ~4k chars

# Internal tracking
OUTPUT=""
CHARS_USED=0

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

show_help() {
    head -n 20 "$0" | grep "^#" | sed 's/^# \?//'
    exit 0
}

log_debug() {
    if [[ "${DEBUG:-}" == "1" ]]; then
        echo "[DEBUG] $*" >&2
    fi
}

estimate_chars() {
    echo -n "$1" | wc -c
}

add_section() {
    local content="$1"
    local section_chars
    section_chars=$(estimate_chars "$content")

    CHARS_USED=$((CHARS_USED + section_chars))
    OUTPUT="${OUTPUT}${content}"

    log_debug "Added section: $section_chars chars (total: $CHARS_USED / $MAX_CHARS)"
}

check_budget() {
    local required="$1"
    local available=$((MAX_CHARS - CHARS_USED))

    if [[ $available -ge $required ]]; then
        return 0
    else
        return 1
    fi
}

add_truncation_marker() {
    local reason="$1"
    local marker="\n\n---\n*[Truncated: $reason. Current output: $CHARS_USED chars]*\n---\n\n"
    add_section "$marker"
}

# ------------------------------------------------------------------------------
# Data Collection Functions
# ------------------------------------------------------------------------------

get_current_state() {
    log_debug "Collecting current state..."

    local output=""

    # Header
    output+="# Repository Implementation Context\n\n"
    output+="Generated: $(date '+%Y-%m-%d %H:%M:%S')\n\n"

    # Branch information
    output+="## Current State\n\n"
    output+="### Branch Context\n\n"

    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "DETACHED")
    output+="- **Current Branch**: \`$current_branch\`\n"

    if [[ "$current_branch" != "HEAD" && "$current_branch" != "DETACHED" ]]; then
        local upstream
        upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "none")
        output+="- **Upstream**: \`$upstream\`\n"

        if [[ "$upstream" != "none" ]]; then
            local ahead behind
            ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
            behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
            output+="- **Status**: "
            if [[ $ahead -gt 0 ]]; then
                output+="↑$ahead ahead"
            fi
            if [[ $behind -gt 0 ]]; then
                [[ $ahead -gt 0 ]] && output+=", "
                output+="↓$behind behind"
            fi
            if [[ $ahead -eq 0 && $behind -eq 0 ]]; then
                output+="up to date"
            fi
            output+="\n"
        fi
    fi

    output+="\n"

    # Staged changes
    output+="### Staged Changes\n\n"
    local staged
    staged=$(git diff --cached --stat 2>/dev/null || echo "")
    if [[ -n "$staged" ]]; then
        output+="\`\`\`\n$staged\n\`\`\`\n\n"
    else
        output+="*No staged changes*\n\n"
    fi

    # Unstaged changes
    output+="### Unstaged Changes\n\n"
    local unstaged
    unstaged=$(git diff --stat 2>/dev/null || echo "")
    if [[ -n "$unstaged" ]]; then
        output+="\`\`\`\n$unstaged\n\`\`\`\n\n"
    else
        output+="*No unstaged changes*\n\n"
    fi

    # Untracked files
    output+="### Untracked Files\n\n"
    local untracked
    untracked=$(git ls-files --others --exclude-standard 2>/dev/null || echo "")
    if [[ -n "$untracked" ]]; then
        local count
        count=$(echo "$untracked" | wc -l)
        output+="*$count untracked file(s)*\n\n"

        # Categorize by extension
        local categories=""
        while IFS= read -r file; do
            local ext="${file##*.}"
            [[ "$file" == *.* ]] || ext="(no ext)"
            categories+="$ext\n"
        done <<< "$untracked"

        local category_summary
        category_summary=$(echo -e "$categories" | sort | uniq -c | sort -rn | head -5)

        if [[ -n "$category_summary" ]]; then
            output+="**By type:**\n"
            while IFS= read -r line; do
                output+="- $line\n"
            done <<< "$category_summary"
            output+="\n"
        fi

        # Show first 10 files
        if [[ $count -le 10 ]]; then
            output+="**Files:**\n\`\`\`\n$untracked\n\`\`\`\n\n"
        else
            local first_ten
            first_ten=$(echo "$untracked" | head -10)
            output+="**First 10 files:**\n\`\`\`\n$first_ten\n... ($((count - 10)) more)\n\`\`\`\n\n"
        fi
    else
        output+="*No untracked files*\n\n"
    fi

    echo -e "$output"
}

get_commit_log() {
    local limit="$1"
    local format_type="${2:-full}"

    log_debug "Collecting commit log: $limit commits, format=$format_type"

    local output=""

    # Get commits with detailed stats
    local commits
    commits=$(git log -n "$limit" --format="%H|%an|%ai|%s" "$REFERENCE" 2>/dev/null || echo "")

    if [[ -z "$commits" ]]; then
        echo "*No commits found*"
        return
    fi

    local commit_count=0
    while IFS='|' read -r hash author date message; do
        commit_count=$((commit_count + 1))

        if [[ "$format_type" == "full" ]]; then
            # Full format for recent commits
            output+="### Commit #$commit_count: ${message:0:80}\n\n"
            output+="- **Hash**: \`${hash:0:8}\`\n"
            output+="- **Author**: $author\n"
            output+="- **Date**: ${date:0:19}\n"

            # Extract commit type
            local commit_type="other"
            if [[ "$message" =~ ^(feat|fix|docs|refactor|test|chore|style|perf|ci|build): ]]; then
                commit_type="${BASH_REMATCH[1]}"
            fi
            output+="- **Type**: \`$commit_type\`\n\n"

            # Message (full)
            output+="**Message:**\n\`\`\`\n$message\n\`\`\`\n\n"

            # File stats
            local stats
            stats=$(git diff --stat "$hash^..$hash" 2>/dev/null || echo "")
            if [[ -n "$stats" ]]; then
                output+="**Changes:**\n\`\`\`\n$stats\n\`\`\`\n\n"
            fi

            output+="---\n\n"
        else
            # Compact format for extended history
            local short_date="${date:0:10}"
            local commit_type="[other]"
            if [[ "$message" =~ ^(feat|fix|docs|refactor|test|chore|style|perf|ci|build): ]]; then
                commit_type="[${BASH_REMATCH[1]}]"
            fi
            output+="- \`${hash:0:8}\` $short_date $commit_type ${message:0:100}\n"
        fi
    done <<< "$commits"

    echo -e "$output"
}

get_file_stats() {
    local days="$1"

    log_debug "Collecting file change statistics for last $days days..."

    local output=""
    output+="## File Change Heatmap\n\n"
    output+="*Files modified most frequently in the last $days days*\n\n"

    # Get file change frequencies
    local since_date
    since_date=$(date -d "$days days ago" '+%Y-%m-%d' 2>/dev/null || date -v-${days}d '+%Y-%m-%d' 2>/dev/null || echo "")

    local file_changes
    if [[ -n "$since_date" ]]; then
        file_changes=$(git log --since="$since_date" --name-only --format="" "$REFERENCE" 2>/dev/null | sort | uniq -c | sort -rn | head -30)
    else
        file_changes=$(git log -n 100 --name-only --format="" "$REFERENCE" 2>/dev/null | sort | uniq -c | sort -rn | head -30)
    fi

    if [[ -n "$file_changes" ]]; then
        output+="### Top 30 Most Changed Files\n\n"
        output+="\`\`\`\n$file_changes\n\`\`\`\n\n"
    else
        output+="*No file changes found*\n\n"
    fi

    # Directory-level summary
    output+="### Changes by Directory\n\n"
    local dir_changes
    if [[ -n "$since_date" ]]; then
        dir_changes=$(git log --since="$since_date" --name-only --format="" "$REFERENCE" 2>/dev/null | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -15)
    else
        dir_changes=$(git log -n 100 --name-only --format="" "$REFERENCE" 2>/dev/null | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -15)
    fi

    if [[ -n "$dir_changes" ]]; then
        output+="\`\`\`\n$dir_changes\n\`\`\`\n\n"
    else
        output+="*No directory changes found*\n\n"
    fi

    # File type breakdown
    output+="### Changes by File Type\n\n"
    local type_changes
    if [[ -n "$since_date" ]]; then
        type_changes=$(git log --since="$since_date" --name-only --format="" "$REFERENCE" 2>/dev/null | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -10)
    else
        type_changes=$(git log -n 100 --name-only --format="" "$REFERENCE" 2>/dev/null | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -10)
    fi

    if [[ -n "$type_changes" ]]; then
        output+="\`\`\`\n$type_changes\n\`\`\`\n\n"
    else
        output+="*No file type data available*\n\n"
    fi

    echo -e "$output"
}

get_timeline_summary() {
    local days="$1"

    log_debug "Generating timeline summary for last $days days..."

    local output=""
    output+="## Timeline Summary\n\n"

    # Weekly commit count
    output+="### Commits per Week\n\n"

    local since_date
    since_date=$(date -d "$days days ago" '+%Y-%m-%d' 2>/dev/null || date -v-${days}d '+%Y-%m-%d' 2>/dev/null || echo "")

    if [[ -n "$since_date" ]]; then
        local weekly_commits
        weekly_commits=$(git log --since="$since_date" --format="%ai" "$REFERENCE" 2>/dev/null | cut -d' ' -f1 | cut -d'-' -f1,2 | uniq -c)

        if [[ -n "$weekly_commits" ]]; then
            output+="\`\`\`\n$weekly_commits\n\`\`\`\n\n"
        fi
    fi

    # Detect major commits (>100 lines changed)
    output+="### Major Commits\n\n"
    output+="*Commits with >100 lines changed*\n\n"

    local major_commits
    major_commits=$(git log -n 50 --format="%h|%ai|%s" --shortstat "$REFERENCE" 2>/dev/null | \
        awk -v RS= -F'|' '
            NF > 1 {
                split($0, a, "\n")
                split(a[2], stats, " ")
                for (i in stats) {
                    if (stats[i] ~ /^[0-9]+$/ && stats[i] > 100) {
                        printf "%s | %s | %s | %s lines\n", substr(a[1], 1, 40), substr($2, 1, 10), substr($3, 1, 60), stats[i]
                        break
                    }
                }
            }
        ' | head -10)

    if [[ -n "$major_commits" ]]; then
        output+="\`\`\`\n$major_commits\n\`\`\`\n\n"
    else
        output+="*No major commits found*\n\n"
    fi

    echo -e "$output"
}

# ------------------------------------------------------------------------------
# Argument Parsing
# ------------------------------------------------------------------------------

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --days)
                DAYS="$2"
                shift 2
                ;;
            --max-chars)
                MAX_CHARS="$2"
                shift 2
                ;;
            --reference)
                REFERENCE="$2"
                shift 2
                ;;
            --recent-commits)
                RECENT_COMMITS="$2"
                if [[ $RECENT_COMMITS -gt 20 ]]; then
                    echo "Warning: --recent-commits limited to max 20, using 20" >&2
                    RECENT_COMMITS=20
                fi
                shift 2
                ;;
            --format)
                FORMAT="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                ;;
            *)
                echo "Unknown option: $1" >&2
                echo "Use --help for usage information" >&2
                exit 1
                ;;
        esac
    done
}

# ------------------------------------------------------------------------------
# Main Assembly
# ------------------------------------------------------------------------------

main() {
    parse_args "$@"

    # Verify we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Error: Not in a git repository" >&2
        exit 1
    fi

    log_debug "Configuration: days=$DAYS, max_chars=$MAX_CHARS, reference=$REFERENCE, recent_commits=$RECENT_COMMITS"

    # Section 1: Current State (P0)
    local section1
    section1=$(get_current_state)
    add_section "$section1"

    # Section 2: Recent Commits (P0)
    local section2=""
    section2+="## Recent Commits (Last $RECENT_COMMITS)\n\n"
    section2+=$(get_commit_log "$RECENT_COMMITS" "full")

    local section2_size
    section2_size=$(estimate_chars "$section2")
    local budget2=$((MAX_CHARS * BUDGET_RECENT_COMMITS / 100))

    if [[ $section2_size -le $budget2 ]] || check_budget "$section2_size"; then
        add_section "$section2"
    else
        # Truncate commits if necessary
        local reduced_commits=$((RECENT_COMMITS * 2 / 3))
        section2="## Recent Commits (Last $reduced_commits, truncated from $RECENT_COMMITS)\n\n"
        section2+=$(get_commit_log "$reduced_commits" "full")
        add_section "$section2"
        add_truncation_marker "Reduced commit count due to budget constraints"
    fi

    # Section 3: File Heatmap (P1)
    if check_budget $((MAX_CHARS * BUDGET_FILE_HEATMAP / 100)); then
        local section3
        section3=$(get_file_stats "$DAYS")
        add_section "$section3"
    else
        add_truncation_marker "Skipped file heatmap due to budget limit"
    fi

    # Section 4: Extended History (P1)
    if check_budget $((MAX_CHARS * BUDGET_EXTENDED_HISTORY / 100)); then
        local extended_count=$((RECENT_COMMITS * 3))
        local section4=""
        section4+="## Extended History (Commits $((RECENT_COMMITS + 1)) to $extended_count)\n\n"
        section4+=$(git log -n "$extended_count" --skip="$RECENT_COMMITS" --format="- \`%h\` %ai %s" "$REFERENCE" 2>/dev/null || echo "*No additional commits*")
        section4+="\n\n"

        if check_budget "$(estimate_chars "$section4")"; then
            add_section "$section4"
        else
            add_truncation_marker "Skipped extended history due to budget limit"
        fi
    else
        add_truncation_marker "Skipped extended history due to budget limit"
    fi

    # Section 5: Timeline Summary (P2)
    if check_budget $((MAX_CHARS * BUDGET_TIMELINE / 100)); then
        local section5
        section5=$(get_timeline_summary "$DAYS")

        if check_budget "$(estimate_chars "$section5")"; then
            add_section "$section5"
        else
            add_truncation_marker "Skipped timeline summary due to budget limit"
        fi
    else
        add_truncation_marker "Skipped timeline summary due to budget limit"
    fi

    # Output final result
    echo -e "$OUTPUT"

    log_debug "Final output: $CHARS_USED characters"
}

# ------------------------------------------------------------------------------
# Execute
# ------------------------------------------------------------------------------

main "$@"
