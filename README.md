# Prompt-Optimierer

Zeigt über der Chatzeile von Claude Code (Terminal und Desktop-App) den Knopf **Prompt optimieren**.

So geht's:
1. Prompt frei herunterschreiben oder diktieren – ruhig lang und unsortiert.
2. Knopf drücken. Claude (Sonnet) liest den Entwurf, behält alle Anforderungen, Namen, Zahlen und Pfade, streicht Füllwörter und ordnet alles zu einem klaren Prompt (Ziel, Kontext, Aufgabe, Grenzen, Ergebnis).
3. Der optimierte Prompt ersetzt den Entwurf in der Chatzeile. Prüfen, ggf. anpassen, absenden.
4. Gefällt er nicht: **Original zurück** stellt den ursprünglichen Text wieder her.

Unklare Stellen werden nicht geraten, sondern als „Offen: …“ markiert. Es wird nichts automatisch abgesendet.
Kosten: ein kurzer Modellaufruf pro Klick über das eigene Claude-Konto.

## Installation

Im Terminal (gilt danach für alle Claude-Code-Sitzungen, auch im Code-Tab der Desktop-App):

```bash
claude plugin install prompt-optimierer --marketplace norelva/prompt-optimierer
```

Oder an der Eingabe einer Claude-Code-Sitzung im Terminal:

```
/plugin install prompt-optimierer --marketplace norelva/prompt-optimierer
```

Danach `y` (Marketplace hinzufügen) und den Bereich „user“ wählen.

In der Desktop-App (dort läuft `/plugin` nicht): auf **+** neben der Chatzeile klicken → Plugins → Add marketplace mit `norelva/prompt-optimierer` → Add plugin.

Hinweis: Der Knopf erscheint nur in Claude Code (Terminal und Code-Tab), nicht im normalen Chat auf claude.ai.

## Lizenz

MIT
