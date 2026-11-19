# norelva-sparen

Claude-Code-Plugin von Norelva. Es senkt den Verbrauch des Nutzungslimits, ohne die Ergebnisse zu verschlechtern. Stand: 2026-11-19 (FA), Version 0.1.0.

## Inhalt

| Teil | Name | Modell / Art | Wozu |
|---|---|---|---|
| Agent | `norelva-sparen:recherche` | Sonnet, effort medium, ohne CLAUDE.md | Web- und Doku-Recherche, gibt nur Ergebnis und Quellen zurück |
| Agent | `norelva-sparen:vault-suche` | Haiku, effort low, ohne CLAUDE.md | Sucht im Firmen-Vault, gibt nur Fundstellen zurück |
| Agent | `norelva-sparen:pruefer-text` | Sonnet, liest CLAUDE.md | Unabhängige Zweitprüfung von Kundentexten, Geld und Recht |
| Agent | `norelva-sparen:ausgabe-filter` | Haiku, effort low, ohne CLAUDE.md | Tests, Builds, Logs: gibt nur Status und Fehler zurück |
| Skill | `sparsam-arbeiten` | lädt nur bei Bedarf | Regeln: wann delegieren, Ausgaben kürzen, Browser per Text, eine Sitzung pro Thema |
| Skill | `/norelva-sparen:uebergabe` | nur von Hand | Kurzer Übergabetext vor `/clear` oder einer neuen Sitzung |
| Hook | `UserPromptSubmit` → `scripts/sitzungs-hinweis.sh` | Shell, ohne Netz, etwa 0,1 s | Hinweis bei 150k, 300k, 500k und 800k Tokens Kontext (je einmal pro Sitzung) und nach mehr als 60 Minuten Pause (Cache kalt) |
| Extra | `extras/Explore.md` | Sonnet, **nicht aktiv** | Nicht mehr nötig, wenn die Leiste installiert ist (sie lenkt Explore um). Sonst von Hand kopieren (siehe unten) |

Grundlast laut `claude plugin details`: etwa 720 Tokens pro Sitzung (Beschreibungen der Skills und Agents). Die vollen Texte werden erst beim Aufruf geladen.

## Leiste über der Chatzeile (Mod `norelva-sparen-leiste`, Ordner `leiste/`)

Alles steht in einer Zeile, rechts neben „Prompt optimieren“. Fehlt der Prompt-Optimierer, bekommt die Leiste eine eigene Zeile.

| Knopf / Anzeige | Wirkung |
|---|---|
| **Sparen an / aus** | An: Subagents, die auf Opus oder Fable laufen würden (z. B. Explore, general-purpose), laufen auf dem gewählten günstigeren Modell, und der Größen-Hinweis ist aktiv. Aus: alles läuft wie ohne Plugin. Die Wahl wird gespeichert |
| **Sonnet / Haiku / Opus / Fable** | Welches Modell diese Subagents bekommen (Klick schaltet weiter). Sonnet = Standard und sparsam, Haiku = am günstigsten für einfache Suchen, Opus = wie ohne Plugin, Fable = stärkstes Modell für wichtige Aufgaben (teurer). Agents mit eigenem Modell (z. B. vault-suche auf Haiku) bleiben unverändert |
| **Übergabe** | Startet sofort `/norelva-sparen:uebergabe`. Claude fasst die Sitzung zusammen und schlägt in der Desktop-App eine neue Sitzung als Karte vor, die mit der Übergabe weiterarbeitet. Im Terminal kommt ein Block zum Kopieren |
| Kontext xx % | Füllstand des Kontextfensters, die Farbe geht von Grün über Gelb nach Rot |
| Sitzung xx % · Woche xx % | Verbrauch im 5-Stunden-Limit (links) und im Wochenlimit (rechts), die Farbe geht von Grün nach Rot |

Der Hauptchat wird nie umgeschaltet, weil ein Modellwechsel mitten in der Sitzung den Prompt-Cache verwirft. Die Umlenkung der Subagents läuft über `turn.step` der Mod-Schnittstelle (Early Access, kann sich mit Updates ändern).

## Installieren

Siehe README im Hauptordner des Repos (Marktplatz `prompt-optimierer`, GitHub `norelva/prompt-optimierer`). Kurz:

```bash
claude plugin install norelva-sparen-leiste --marketplace norelva/prompt-optimierer
```

Die Leiste zieht `norelva-sparen` als Abhängigkeit mit. Abschalten: `claude plugin disable norelva-sparen-leiste@prompt-optimierer` bzw. `norelva-sparen@prompt-optimierer`.

## Explore günstiger machen (optional, nicht aktiv)

Laut Doku kann ein Plugin den eingebauten Explore-Agent **nicht** ersetzen. Das geht nur mit einer Datei in `~/.claude/agents/` (alle Projekte) oder `<projekt>/.claude/agents/` (ein Projekt). Mit Zustimmung von FA:

```bash
mkdir -p ~/.claude/agents && cp <Plugin-Ordner>/extras/Explore.md ~/.claude/agents/Explore.md
```

PRÜFEN: Der eingebaute Explore hat einen längeren eigenen Systemprompt. Werden die Suchergebnisse schlechter, die Datei wieder entfernen (Papierkorb, nicht endgültig löschen).

## Hook einstellen

Optionale Umgebungsvariablen (z. B. unter `env` in `~/.claude/settings.json`):

| Variable | Standard | Bedeutung |
|---|---|---|
| `NORELVA_SPAREN_STUFEN` | `150000 300000 500000 800000` | Token-Schwellen für den Größen-Hinweis |
| `NORELVA_SPAREN_CACHE_MIN` | `60` | Pause in Minuten, ab der der Cache-Hinweis kommt |
| `NORELVA_SPAREN_CACHE_MIN_TOKENS` | `50000` | Cache-Hinweis erst ab dieser Kontextgröße |

So funktioniert der Hook: Er liest die letzten 2 MB des Transkripts und nimmt die Token-Zahlen der letzten Antwort im Hauptverlauf (`input`, `cache_read` und `cache_creation`). Daraus schätzt er die Kontextgröße. Der Hinweis geht als `additionalContext` an Claude, das ihn in einem Satz weitergibt, und zusätzlich als `systemMessage`. Ob die `systemMessage` bei UserPromptSubmit direkt angezeigt wird, steht nicht in der Doku (PRÜFEN). Ohne `jq` oder bei Fehlern beendet sich der Hook still. Merkdateien pro Sitzung liegen in `${CLAUDE_PLUGIN_DATA}`.

## Nicht möglich (Doku, 19.11.2026)

- Automatischer Modellwechsel per Shell-Hook (settings-Hooks). Über die Mod-Schnittstelle (`turn.step`) ist es dagegen möglich: Die Leiste nutzt das nur für Subagents
- Plugin-Agents ignorieren `hooks`, `mcpServers` und `permissionMode` im Frontmatter

## Ergänzende Einstellungen (nicht im Plugin, nur mit Zustimmung)

- `crossSessionInbound: "hold"`: Nachrichten anderer Sitzungen starten keinen Turn mit vollem Kontext, solange die Sitzung ruht
- Vorschläge für den nächsten Prompt abschalten: spart kleine Anfragen nach jeder Antwort
- `/effort` bei einfachen Aufgaben senken

## Quellen

code.claude.com/docs: plugins-reference (Manifest), plugins/marketplace-reference, sub-agents, hooks, skills, costs (abgerufen 2026-11-19).
