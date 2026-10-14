#!/usr/bin/env bash
# Hook PreToolUse (git push): solo deja hacer push si los tests pasan.
cat >/dev/null
cd "$CLAUDE_PROJECT_DIR" || exit 0

if output=$(npm test 2>&1); then
  exit 0
fi

jq -n --arg out "$(tail -n 60 <<<"$output")" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("Push bloqueado: los tests fallan. Arregla el código, haz commit del arreglo y vuelve a intentar el push.\n\n" + $out)
  }
}'
