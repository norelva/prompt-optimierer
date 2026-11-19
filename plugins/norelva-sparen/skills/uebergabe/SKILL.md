---
name: uebergabe
description: Fasst die Sitzung kurz zusammen und schlägt eine neue Sitzung vor, die mit dieser Übergabe klein weiterarbeitet.
disable-model-invocation: true
---

# Übergabe in eine neue Sitzung

Ziel: Die Arbeit geht in einer neuen, kleinen Sitzung nahtlos weiter, statt diese große Sitzung weiter mitzuschleppen.

## 1. Übergabe schreiben

Fasse diese Sitzung so zusammen, dass eine neue Sitzung ohne den bisherigen Verlauf weiterarbeiten kann (höchstens etwa 40 Zeilen):

```markdown
# Übergabe: <Thema> (<JJJJ-MM-TT>)
## Ziel
<1–2 Sätze>
## Stand
- <was erledigt und geprüft ist>
## Entscheidungen
- <was FA oder die Gründer entschieden haben, mit Grund in wenigen Worten>
## Offen / nächster Schritt
- <konkreter nächster Schritt zuerst>
## Wichtige Dateien und Orte
- <Pfad> – <wozu>
## Nicht vergessen
- <Regeln, Fallstricke, PRÜFEN-Punkte>
```

Regeln:
- Nur Fakten aus dieser Sitzung. Nichts erfinden, Unsicheres mit `PRÜFEN` markieren.
- Keine Passwörter, Schlüssel oder personenbezogenen Kundendaten.
- Keine langen Code- oder Ausgabeblöcke. Nur Pfade nennen.

## 2. Neue Sitzung vorschlagen

- **Desktop-App** (das Werkzeug `mcp__ccd_session__start_session` ist vorhanden oder als verzögertes Werkzeug gelistet und wird dann mit ToolSearch geladen): Schlage die neue Sitzung als Karte vor. Dafür `start_session` mit `initiation: "own_initiative"`, `context: "fresh"` und `title: "Weiter: <Thema>"` aufrufen. Den Prompt setzt du aus dem Übergabetext oben zusammen, davor den Satz: „Arbeite auf Grundlage dieser Übergabe weiter. Lies zuerst die genannten Dateien und frag nach, wenn etwas fehlt.“ Starte die Sitzung nicht selbst, FA klickt die Karte.
- **Terminal oder ohne dieses Werkzeug:** Gib den Übergabetext in einem Codeblock zum Kopieren aus. Danach ein Satz: „Jetzt /clear oder eine neue Sitzung starten und den Block als erste Nachricht einfügen.“

Danach nur ein Satz an FA, z. B. „Übergabe steht. Neue Sitzung ist vorgeschlagen, diese hier kann danach archiviert werden.“ Nichts speichern, senden oder archivieren ohne Zustimmung.
