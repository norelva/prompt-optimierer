import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Original } from '../types'

const isBusy = atom({ plugin: 'prompt-optimierer', key: 'isBusy' } as const, false)
const original = atom({ plugin: 'prompt-optimierer', key: 'original' } as const, null as Original)

const SYSTEM = `Du bist ein Prompt-Optimierer. Du bekommst einen Rohentwurf, den jemand frei heruntergeschrieben oder diktiert hat (oft lang, sprunghaft, mit Wiederholungen und Füllwörtern).
Schreibe daraus EINEN optimalen Prompt für ein KI-Modell (Claude), der genau den beabsichtigten Arbeitsschritt auslöst.

Regeln:
- Behalte ALLE inhaltlichen Anforderungen, Fakten, Namen, Zahlen, Dateipfade und Einschränkungen. Nichts weglassen, nichts erfinden.
- Entferne Füllwörter, Wiederholungen und Gedankensprünge; ordne logisch.
- Struktur, wo sinnvoll: Ziel (1–2 Sätze) · Kontext · Aufgabe/Schritte · Anforderungen & Grenzen · gewünschtes Ergebnis/Format.
- Bei kurzen, einfachen Anliegen: kurz bleiben, keine künstliche Struktur.
- Unklare Stellen nicht raten: als offene Frage am Ende markieren ("Offen: …") oder Claude bitten, vorher nachzufragen.
- Gleiche Sprache und Du/Sie-Form wie der Entwurf.
- Antworte NUR mit dem fertigen Prompt – keine Einleitung, keine Erklärung, keine Anführungszeichen oder Codeblöcke drumherum.`

export const register: Register = on => {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const busy = await read($, isBusy)
    const before = await read($, original)
    const { Box, Button, Text } = $.ui.resolve(e)

    const optimize = async () => {
      if (await read($, isBusy)) return
      const { text } = await $.prompt.read()
      if (text.trim().length < 3) {
        $.ui.toast('Erst etwas in die Chatzeile schreiben.')
        return
      }
      await update($, isBusy, () => true)
      try {
        const r = await $.model.complete({
          model: 'sonnet',
          system: SYSTEM,
          prompt: `Rohentwurf:\n<<<\n${text}\n>>>`,
          maxTokens: 4000,
          timeoutMs: 90000,
        })
        if (!r.isAnswered) {
          $.ui.toast(`Optimieren fehlgeschlagen (${r.reason}).`)
          return
        }
        const better = r.text.trim()
        if (!better) return
        await update($, original, () => text)
        const filled = await $.prompt.fill({ text: better, mode: 'replace' })
        $.ui.toast(filled.isFilled ? 'Prompt optimiert – prüfen und absenden.' : 'Konnte die Chatzeile nicht füllen.')
      } finally {
        await update($, isBusy, () => false)
      }
    }

    const undo = async () => {
      const prev = await read($, original)
      if (prev === null) return
      await $.prompt.fill({ text: prev, mode: 'replace' })
      await update($, original, () => null)
    }

    return (
      <Box>
        {busy ? (
          <Text dimColor>Optimiere Prompt …</Text>
        ) : (
          <Button key="optimize" variant="primary" onPress={optimize}>
            Prompt optimieren
          </Button>
        )}
        {before !== null && !busy ? (
          <Button key="undo" onPress={undo}>
            Original zurück
          </Button>
        ) : null}
      </Box>
    )
  })

  // Nach dem Absenden ist das gemerkte Original nicht mehr nötig.
  on('prompt.submit', async ($, e, next) => {
    await update($, original, () => null).catch(() => undefined)
    return next(e)
  })
}
