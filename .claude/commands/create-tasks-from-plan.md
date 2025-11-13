# Create new tasks for plan

## Description

We created a high level plan for the implementation of the current feature.

Your task is to check how far we already got during implementation and what the next implementation tasks should be.

Then create those tasks as markdown files in a way that can be directly used as instructions for implementation.

Think from the perspective of an LLM that needs to implement the tasks. What information is crucial to proceed? What would you need to investigate? How would you go about implementation?

IMPORTANT: Do not plan ahead too far. Create at most 3 new tasks. Take into account what is already in the backlog / in progress (if any)

## Additional user input (if any)

User: $ARGUMENTS

## File Naming and Location

- Save new task files to: `docs/Implementation/2 Backlog/`
- Naming convention: `Phase{N}-Task{M}-{ShortDescription}.md` or `{ShortDescription}.md`
- Tasks don't need to be numbered but can be for clarity
- Use descriptive names that clearly indicate the task purpose

---

## Context

### List of logfiles

!`ls -la docs/History`

### Content of most recent log files

!`.claude/scripts/read_recent_history.sh`

### Git History / Full git context

!`.claude/scripts/get_recent_implementation_context.sh --recent-commits 10`

### List of finished tasks

!`ls -la "docs/Tasks/04_Archive"`

### List of tasks in progress

!`ls -la "docs/Tasks/03_InProgress"`

### List of already planned tasks (in backlog)

!`ls -la "docs/Tasks/02_Backlog"`

---

## Output format / Template

You are free to add context to the task. It should always contain the following sections:

**IMPORTANT: Keep everything CONDENSED. Be concise and focused. Only include essential information.**

```markdown
# Phase 1 - Task 1: Web UI + Test Message Producer

## Description

{A very condensed description of what we want to achieve - 2-3 sentences max}

## Context

### Current state

{CONDENSED: A brief summary of what was recently implemented, ONLY if it directly relates to the new task - 2-3 sentences max}

### Related Documents

{CONDENSED: List ONLY file PATHS that are directly relevant to implementing this specific task - not the entire codebase! Include brief one-line descriptions of each file's PURPOSE.}

---

## Requirements

### Functional

{CONDENSED: Bullet points of functional requirements - focus on WHAT, not HOW}

### Technical

{CONDENSED: Bullet points of technical/non-functional requirements - frameworks, performance, compatibility}

### Constraints

{CONDENSED: Bullet points of limitations, boundaries, must-not-do items}

---

## Deliverables

{CONDENSED: Bullet list of concrete outputs - files, features, documentation}

---

## Acceptance Criteria

{CONDENSED: Bullet list of specific, testable criteria that define "done"}

```