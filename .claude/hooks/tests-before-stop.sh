#!/usr/bin/env bash
# Hook Stop: si los tests fallan, impide que Claude termine y le pasa el error para que lo arregle.
input=$(cat)
session=$(jq -r '.session_id // "default"' <<<"$input")
counter="${TMPDIR:-/tmp}/claude-stop-tests-$session"
MAX_ATTEMPTS=5

cd "$CLAUDE_PROJECT_DIR" || exit 0

if output=$(npm test 2>&1); then
  rm -f "$counter"
  exit 0
fi

attempts=$(( $(cat "$counter" 2>/dev/null || echo 0) + 1 ))
echo "$attempts" > "$counter"

# Evita un bucle infinito si no se consigue arreglar
if (( attempts > MAX_ATTEMPTS )); then
  rm -f "$counter"
  jq -n '{systemMessage: "⚠️ Los tests siguen fallando tras varios intentos de arreglo. Revísalos manualmente."}'
  exit 0
fi

jq -n --arg out "$(tail -n 60 <<<"$output")" --arg n "$attempts" --arg max "$MAX_ATTEMPTS" '{
  decision: "block",
  reason: ("Los tests fallan (intento \($n)/\($max)). Arregla el código (no borres ni debilites los tests) y vuelve a ejecutar npm test hasta que pasen.\n\n" + $out)
}'
