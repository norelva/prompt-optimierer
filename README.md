# Norelva-Plugins für Claude Code

Marktplatz `prompt-optimierer` (GitHub `norelva/prompt-optimierer`) mit drei Plugins:

| Plugin | Was es macht |
|---|---|
| **prompt-optimierer** | Knopf **Prompt optimieren** über der Chatzeile: formuliert den getippten Prompt in einen klaren, optimalen Prompt um |
| **norelva-sparen** | Senkt den Verbrauch des Nutzungslimits: günstigere Agents (recherche, vault-suche, pruefer-text, ausgabe-filter), Skill „sparsam-arbeiten“, Übergabe in eine neue Sitzung, Hinweis bei großen Sitzungen. Details: [plugins/norelva-sparen/README.md](plugins/norelva-sparen/README.md) |
| **norelva-sparen-leiste** | Leiste neben „Prompt optimieren“: Sparen an/aus, Modell der Agents (Sonnet/Haiku/Opus/Fable), Übergabe-Knopf, Kontext und Limits (Sitzung, Woche) in Prozent. Bringt `norelva-sparen` automatisch mit |

## Installation (alles auf einmal)

`prompt-optimierer` bringt `norelva-sparen-leiste` und `norelva-sparen` als Abhängigkeiten mit. Ein Befehl im Terminal reicht (gilt danach für alle Claude-Code-Sitzungen dieses Kontos auf diesem Rechner, auch im Code-Tab der Desktop-App):

```bash
claude plugin install prompt-optimierer --marketplace norelva/prompt-optimierer
```

Oder an der Eingabe einer Claude-Code-Sitzung im Terminal: `/plugin install prompt-optimierer --marketplace norelva/prompt-optimierer`, dann `y` (Marketplace hinzufügen) und den Bereich „user“ wählen.

In der Desktop-App (dort läuft `/plugin` nicht): auf **+** neben der Chatzeile klicken → Plugins → Add marketplace mit `norelva/prompt-optimierer` → die Plugins hinzufügen.

Danach eine neue Sitzung öffnen.

## Prompt-Optimierer: so geht's

1. Prompt frei herunterschreiben oder diktieren – ruhig lang und unsortiert.
2. Knopf drücken. Claude (Sonnet) liest den Entwurf, behält alle Anforderungen, Namen, Zahlen und Pfade, streicht Füllwörter und ordnet alles zu einem klaren Prompt (Ziel, Kontext, Aufgabe, Grenzen, Ergebnis).
3. Der optimierte Prompt ersetzt den Entwurf in der Chatzeile. Prüfen, ggf. anpassen, absenden.
4. Gefällt er nicht: **Original zurück** stellt den ursprünglichen Text wieder her.

Unklare Stellen werden nicht geraten: Der optimierte Prompt weist den Chat an, vor dem Start Rückfragen zu stellen. Der Originaltext wird wörtlich als Kontext unten angehängt (bei Widerspruch gilt der Auftrag oben). Es wird nichts automatisch abgesendet.
Kosten: ein kurzer Modellaufruf pro Klick über das eigene Claude-Konto.

## Aktualisieren

**Einmal Auto-Update einschalten** (empfohlen): In einer Claude-Code-Sitzung im Terminal `/plugin` → Reiter **Marketplaces** → `prompt-optimierer` → Auto-Update an. Danach kommen neue Versionen (auch neu hinzugekommene Plugins wie die Sparen-Leiste) von selbst, spätestens beim nächsten Start. Für Marktplätze von GitHub ist Auto-Update standardmäßig aus.

Von Hand:

```bash
claude plugin marketplace update prompt-optimierer && claude plugin update prompt-optimierer@prompt-optimierer
```

Danach in einer Sitzung `/reload-plugins` ausführen oder eine neue Sitzung öffnen: Dabei werden die neuen Abhängigkeiten (Sparen-Plugins, ab Version 0.3.0) mitinstalliert.

Für Entwickler: Plugins pinnen ihre `version`. Änderungen erreichen Nutzer nur, wenn die Version in `plugin.json` erhöht wird.

Hinweis: Knopf und Leiste erscheinen nur in Claude Code (Terminal und Code-Tab), nicht im normalen Chat auf claude.ai.

## Lizenz

MIT
