#!/bin/bash
# cleanup-worktrees.sh
# Removes git worktrees that are clean (no uncommitted changes)
# and have no unpushed commits.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Git Worktree Cleanup ==="
echo ""

# Get the main worktree (first line of git worktree list)
MAIN_WORKTREE=$(git worktree list --porcelain | head -1 | cut -d' ' -f2)

# Track statistics
REMOVED=0
SKIPPED_DIRTY=0
SKIPPED_UNPUSHED=0
SKIPPED_NO_UPSTREAM=0

# Parse worktree list
while IFS= read -r line; do
    # Skip empty lines
    [[ -z "$line" ]] && continue

    # Parse worktree path (first column)
    WORKTREE_PATH=$(echo "$line" | awk '{print $1}')

    # Skip the main worktree
    if [[ "$WORKTREE_PATH" == "$MAIN_WORKTREE" ]]; then
        echo -e "${YELLOW}[SKIP]${NC} $WORKTREE_PATH (main worktree)"
        continue
    fi

    # Check if worktree directory exists
    if [[ ! -d "$WORKTREE_PATH" ]]; then
        echo -e "${YELLOW}[SKIP]${NC} $WORKTREE_PATH (directory not found)"
        continue
    fi

    # Check for uncommitted changes
    DIRTY=$(git -C "$WORKTREE_PATH" status --porcelain 2>/dev/null)
    if [[ -n "$DIRTY" ]]; then
        echo -e "${RED}[DIRTY]${NC} $WORKTREE_PATH"
        echo "         Has uncommitted changes:"
        echo "$DIRTY" | head -5 | sed 's/^/           /'
        [[ $(echo "$DIRTY" | wc -l) -gt 5 ]] && echo "           ... and more"
        ((SKIPPED_DIRTY++))
        continue
    fi

    # Check for unpushed commits
    # First, check if there's an upstream branch
    UPSTREAM=$(git -C "$WORKTREE_PATH" rev-parse --abbrev-ref @{u} 2>/dev/null) || UPSTREAM=""

    if [[ -z "$UPSTREAM" ]]; then
        echo -e "${RED}[NO UPSTREAM]${NC} $WORKTREE_PATH"
        echo "         Branch has no upstream configured"
        ((SKIPPED_NO_UPSTREAM++))
        continue
    fi

    # Check for commits not pushed to upstream
    UNPUSHED=$(git -C "$WORKTREE_PATH" log @{u}.. --oneline 2>/dev/null)
    if [[ -n "$UNPUSHED" ]]; then
        echo -e "${RED}[UNPUSHED]${NC} $WORKTREE_PATH"
        echo "         Has unpushed commits:"
        echo "$UNPUSHED" | head -5 | sed 's/^/           /'
        [[ $(echo "$UNPUSHED" | wc -l) -gt 5 ]] && echo "           ... and more"
        ((SKIPPED_UNPUSHED++))
        continue
    fi

    # Safe to remove
    echo -e "${GREEN}[REMOVE]${NC} $WORKTREE_PATH"
    git worktree remove "$WORKTREE_PATH"
    ((REMOVED++))

done < <(git worktree list | tail -n +1)

# Summary
echo ""
echo "=== Summary ==="
echo -e "Removed:              ${GREEN}$REMOVED${NC}"
echo -e "Skipped (dirty):      ${RED}$SKIPPED_DIRTY${NC}"
echo -e "Skipped (unpushed):   ${RED}$SKIPPED_UNPUSHED${NC}"
echo -e "Skipped (no upstream):${RED}$SKIPPED_NO_UPSTREAM${NC}"

# Prune any stale worktree references
echo ""
echo "Pruning stale worktree references..."
git worktree prune -v

echo ""
echo "Done!"
