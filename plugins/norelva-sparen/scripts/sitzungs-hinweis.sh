#!/bin/bash
# norelva-sparen: UserPromptSubmit-Hook
# Schätzt die aktuelle Kontextgröße aus dem Transkript (Token-Zahlen der letzten
# Antwort im Hauptverlauf) und gibt bei Schwellen einen kurzen Hinweis.
# Kein Netz, liest nur die letzten ~2 MB des Transkripts. Fehler => still beenden.
#
# Einstellbar per Umgebungsvariable (optional):
#   NORELVA_SPAREN_STUFEN="150000 300000 500000 800000"  Token-Schwellen für den Hinweis
#   NORELVA_SPAREN_CACHE_MIN=60                          Pause in Minuten, ab der der Cache als kalt gilt
#   NORELVA_SPAREN_CACHE_MIN_TOKENS=50000                Cache-Hinweis erst ab dieser Kontextgröße

# Sparmodus in der Leiste ausgeschaltet (Mod norelva-sparen-leiste setzt die Variable)
[ "${NORELVA_SPAREN_AUS:-}" = "1" ] && exit 0

STUFEN="${NORELVA_SPAREN_STUFEN:-150000 300000 500000 800000}"
CACHE_MIN="${NORELVA_SPAREN_CACHE_MIN:-60}"
CACHE_MIN_TOKENS="${NORELVA_SPAREN_CACHE_MIN_TOKENS:-50000}"

JQ="$(command -v jq)" || exit 0
eingabe="$(cat)"

transcript="$(printf '%s' "$eingabe" | "$JQ" -r '.transcript_path // empty' 2>/dev/null)"
sitzung="$(printf '%s' "$eingabe" | "$JQ" -r '.session_id // empty' 2>/dev/null | tr -cd 'A-Za-z0-9_-')"
[ -n "$transcript" ] && [ -f "$transcript" ] || exit 0

# Letzte Antwort im Hauptverlauf (keine Subagent-Zeilen): Kontext-Tokens und Zeitpunkt
werte="$(tail -c 2000000 "$transcript" 2>/dev/null \
  | grep '"type":"assistant"' | grep -v '"isSidechain":true' | tail -1 \
  | "$JQ" -r '[
      ((.message.usage.input_tokens // 0) + (.message.usage.cache_read_input_tokens // 0) + (.message.usage.cache_creation_input_tokens // 0)),
      ((.timestamp // "") | sub("\\.[0-9]+Z$"; "Z") | (try fromdateiso8601 catch 0))
    ] | @tsv' 2>/dev/null)"
[ -n "$werte" ] || exit 0
tokens="${werte%%$'\t'*}"
zeit="${werte##*$'\t'}"
case "$tokens" in ''|*[!0-9]*) exit 0 ;; esac
case "$zeit" in ''|*[!0-9]*) zeit=0 ;; esac

hinweise=()
kontext_tsd=$(( tokens / 1000 ))

# 1) Größen-Hinweis, je Schwelle nur einmal pro Sitzung
datenordner="${CLAUDE_PLUGIN_DATA:-$HOME/.claude/plugins/data/norelva-sparen}"
statusdatei=""
if [ -n "$sitzung" ]; then
  mkdir -p "$datenordner" 2>/dev/null && statusdatei="$datenordner/$sitzung.stufe"
fi
letzte=0
[ -n "$statusdatei" ] && [ -f "$statusdatei" ] && letzte="$(cat "$statusdatei" 2>/dev/null)"
case "$letzte" in ''|*[!0-9]*) letzte=0 ;; esac

erreicht=0
for s in $STUFEN; do
  case "$s" in ''|*[!0-9]*) continue ;; esac
  [ "$tokens" -ge "$s" ] && erreicht="$s"
done
if [ "$erreicht" -gt "$letzte" ]; then
  hinweise+=("Der Kontext dieser Sitzung umfasst etwa ${kontext_tsd}k Tokens (Schätzung aus dem Transkript); jede weitere Nachricht wird mit diesem Umfang verarbeitet. Norelva-Sparregel: Sitzung ist groß – dem Nutzer in einem Satz /clear oder eine neue Sitzung für das nächste Thema vorschlagen, bei Bedarf vorher /norelva-sparen:uebergabe.")
  [ -n "$statusdatei" ] && printf '%s' "$erreicht" > "$statusdatei" 2>/dev/null
fi

# 2) Cache-Hinweis nach langer Pause
if [ "$zeit" -gt 0 ] && [ "$tokens" -ge "$CACHE_MIN_TOKENS" ]; then
  jetzt="$(date +%s)"
  pause_min=$(( (jetzt - zeit) / 60 ))
  if [ "$pause_min" -ge "$CACHE_MIN" ]; then
    hinweise+=("Seit der letzten Antwort sind etwa ${pause_min} Minuten vergangen; der Prompt-Cache ist vermutlich abgelaufen, diese Nachricht verarbeitet die ganzen ${kontext_tsd}k Tokens neu. Norelva-Sparregel: Ist das ein neues Thema, dem Nutzer in einem Satz eine neue Sitzung vorschlagen.")
  fi
fi

[ "${#hinweise[@]}" -gt 0 ] || exit 0

text="$(printf '%s ' "${hinweise[@]}")"
kurz="Sitzung ist groß (~${kontext_tsd}k Tokens) – /clear oder neue Sitzung für das nächste Thema?"
[ "$erreicht" -gt "$letzte" ] || kurz="Lange Pause – Cache vermutlich kalt (~${kontext_tsd}k Tokens). Neues Thema? Dann neue Sitzung."

"$JQ" -n --arg ctx "$text" --arg msg "$kurz" \
  '{systemMessage: $msg, hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: $ctx}}'
exit 0
