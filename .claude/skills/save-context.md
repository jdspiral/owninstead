---
name: save-context
description: Save current session context for restoration after compaction
---

When the user runs `/save-context`, write the current session context to `.claude/session-context.md` in this format:

```markdown
# Session Context
Last saved: [current timestamp]

## Current Task
[Describe what we're currently working on - the main goal/objective]

## Key Decisions Made
- [List important decisions made during this session]
- [Include rationale where relevant]

## Important Context
[Any other state that would be lost and is important to remember]

## Files Being Modified
- [List files that have been modified or are being worked on]

## Next Steps
- [What needs to happen next]
```

After writing the file, confirm what was saved.
