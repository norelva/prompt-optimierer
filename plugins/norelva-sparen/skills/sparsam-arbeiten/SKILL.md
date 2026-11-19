---
name: sparsam-arbeiten
description: Regeln, um das Nutzungslimit zu schonen, ohne schlechtere Ergebnisse. Laden bei Recherche über mehrere Seiten, Suche im Vault, langen Test-/Build-/Log-Ausgaben, Browser-Prüfungen, Textprüfungen oder wenn die Sitzung groß wird.
---

# Sparsam arbeiten (Norelva)

Ziel: weniger Tokens im Hauptchat (Opus), gleiche Qualität. Die Qualität geht vor. Im Zweifel macht der Hauptchat die Arbeit selbst.

## An wen delegieren

| Aufgabe | Agent | Modell | Zurück kommt nur |
|---|---|---|---|
| Web- oder Doku-Recherche über 2 oder mehr Seiten | `norelva-sparen:recherche` | Sonnet | Ergebnis und Quellen |
| Suchen oder Finden im Firmen-Vault | `norelva-sparen:vault-suche` | Haiku | Fundstellen-Tabelle |
| Zweitprüfung Kundentext, Angebot, Geld, Recht | `norelva-sparen:pruefer-text` | Sonnet | Mängelliste und Urteil |
| Tests, Builds, Linter, Logs, große Dateien | `norelva-sparen:ausgabe-filter` | Haiku | Status und Fehler |

- Nicht delegieren, wenn es ein bis drei Tool-Aufrufe sind oder das Ziel bekannt ist (eine Datei lesen, ein `grep`). Ein Agent-Start kostet selbst Kontext.
- Den Auftrag kurz und vollständig formulieren: Ziel, Ort, gewünschtes Format. Der Agent kennt den Chat nicht.
- Für den Prüfer nur Text und Zweck übergeben, nicht die eigene Begründung, damit er unabhängig bleibt.
- Unabhängige Agent-Aufträge in einer Nachricht parallel starten.

## Ausgaben klein halten

- Shell: `| head -50`, `| tail -50`, `grep -n`, `wc -l` statt ganzer Ausgaben. Lange Dateien mit offset/limit lesen.
- Keine ganzen Dateien lesen, um eine Stelle zu finden: erst suchen, dann den Ausschnitt lesen.
- Nur geänderte Stellen bearbeiten (Edit) statt Dateien neu zu schreiben.

## Browser

- Prüfen per Text: `get_page_text`, `read_page`, `find`, `read_console_messages`. Das ist billiger als Screenshots.
- Screenshots nur, wenn es um das Aussehen geht oder als Beleg zum Schluss, dann mit `scale` 0.5.

## Sitzungen

- Ein Thema pro Sitzung. Für ein neues, unabhängiges Thema eine neue Sitzung oder `/clear` statt weiterzumachen.
- Vor `/clear` bei Bedarf `/norelva-sparen:uebergabe` ausführen. Das liefert einen kurzen Übergabetext für die neue Sitzung.
- `/compact` liest die ganze Sitzung und ist selbst teuer. Für einen Neustart lieber Übergabe und `/clear`.
- Nach langer Pause (Cache kalt, je nach Einstellung 5 min oder 1 h, PRÜFEN) lädt die erste Nachricht die ganze Sitzung neu. Bei großen Sitzungen dann lieber neu beginnen.
- Einfache Aufgaben brauchen keine hohe Denkstufe: `/effort` senken, wenn FA zustimmt.
