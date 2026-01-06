#!/bin/bash
# Restore saved context after compaction

CONTEXT_FILE="$CLAUDE_PROJECT_DIR/.claude/session-context.md"

if [ -f "$CONTEXT_FILE" ]; then
    # Read file content, escape for JSON
    CONTENT=$(cat "$CONTEXT_FILE" | jq -Rs .)

    # Output as additionalContext (injected into Claude's context)
    echo "{\"hookSpecificOutput\":{\"additionalContext\":$CONTENT}}"
fi

exit 0
