import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentModell, Messung } from '../types'

// Leiste "Sparen" über der Chatzeile (Norelva, FA).
// - Sparmodus an/aus: an = Subagents, die auf Opus/Fable laufen würden, laufen auf dem gewählten
//   günstigeren Modell; der Größen-Hinweis des Plugins norelva-sparen ist aktiv. Aus = alles wie ohne Plugin.
// - Agents: Sonnet/Haiku umschalten (nur bei Sparmodus an).
// - Anzeige: Kontextgröße und Limit (5 h / 7 Tage), wie die Statuszeile sie hat.
// - Übergabe: schreibt /norelva-sparen:uebergabe in die Chatzeile (nichts wird automatisch gesendet).
// Der Hauptchat wird nie umgeschaltet: ein Modellwechsel mitten in der Sitzung würde den Cache verwerfen.

const aktiv = atom({ plugin: 'norelva-sparen-leiste', key: 'aktiv' } as const, true)
const agentModell = atom({ plugin: 'norelva-sparen-leiste', key: 'agentModell' } as const, 'sonnet' as AgentModell)
const messung = atom({ plugin: 'norelva-sparen-leiste', key: 'messung' } as const, null as Messung)

// Mitteilungen rechts verschwinden nach 1 s von selbst
const KURZ = { timeoutMs: 1000 }
const TEUER = /opus|fable/i
const FOLGE: AgentModell[] = ['sonnet', 'haiku', 'opus', 'fable']
const NAME: Record<AgentModell, string> = { sonnet: 'Sonnet', haiku: 'Haiku', opus: 'Opus', fable: 'Fable' }
const HINWEIS: Record<AgentModell, string> = {
  sonnet: 'Agents: Sonnet – spart, gleiche Qualität für die meisten Aufgaben',
  haiku: 'Agents: Haiku – am günstigsten, nur für einfache Suchen',
  opus: 'Agents: Opus – wie ohne Plugin, für wichtige Aufgaben',
  fable: 'Agents: Fable – stärkstes Modell, am teuersten',
}
// Farbe von Grün (0 %) über Gelb (50 %) nach Rot (100 %)
function ampel(prozent: number): string {
  const p = Math.max(0, Math.min(100, prozent)) / 100
  const rot = Math.round(p < 0.5 ? 2 * p * 220 : 220)
  const gruen = Math.round(p < 0.5 ? 180 : 180 * (1 - (p - 0.5) * 2))
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(rot)}${hex(gruen)}30`
}


// Geteilte Limits: frische Werte (aus session.measure) liegen mit Zeitstempel in $.store,
// das alle Sitzungen gemeinsam nutzen. Kontext bleibt je Sitzung, er ändert sich nur durch eigene Turns.
type GeteilteLimits = { limit5h: number | null; limit7d: number | null; at: number }
let uhr: { cancel(): void } | undefined
let gezeigtAm = 0

async function teilen($: EngineInterface, limits: { kind: string; percentUsed: number }[]) {
  const fuenf = limits.find(l => l.kind === 'five_hour')
  const sieben = limits.find(l => l.kind === 'seven_day')
  if (!fuenf && !sieben) return
  const at = await $.clock.now()
  gezeigtAm = at
  const wert: GeteilteLimits = {
    limit5h: fuenf ? Math.round(fuenf.percentUsed) : null,
    limit7d: sieben ? Math.round(sieben.percentUsed) : null,
    at,
  }
  await $.store.set('limits', wert)
}

async function abgleichen($: EngineInterface) {
  try {
    const g = (await $.store.get('limits')) as GeteilteLimits | undefined
    if (!g || typeof g.at !== 'number' || g.at <= gezeigtAm) return
    gezeigtAm = g.at
    await update($, messung, m => ({
      tokens: m?.tokens ?? null,
      prozent: m?.prozent ?? null,
      limit5h: g.limit5h ?? m?.limit5h ?? null,
      limit7d: g.limit7d ?? m?.limit7d ?? null,
    }))
  } catch {
    // Speicher nicht lesbar: alte Werte bleiben
  }
}

export const register: Register = on => {
  // Gespeicherte Wahl laden und an den Shell-Hook weitergeben
  on('session.start', async ($, e, next) => {
    const gespeichertAktiv = await $.store.get('aktiv')
    const gespeichertModell = await $.store.get('agentModell')
    if (typeof gespeichertAktiv === 'boolean') await update($, aktiv, () => gespeichertAktiv)
    if (typeof gespeichertModell === 'string' && (FOLGE as string[]).includes(gespeichertModell)) {
      await update($, agentModell, () => gespeichertModell as AgentModell)
    }
    const istAktiv = await read($, aktiv)
    await $.env.set('NORELVA_SPAREN_AUS', istAktiv ? undefined : '1')
    try {
      const u = await $.session.usage()
      await merken($, u.context.tokens, u.context.percent, u.rateLimits)
    } catch {
      // keine Messung verfügbar
    }
    // Limits gelten fürs ganze Konto: alle 30 s die neuesten Werte anderer Sitzungen übernehmen
    await abgleichen($)
    uhr?.cancel()
    uhr = $.clock.every(30_000, () => {
      void abgleichen($)
    })
    return next(e)
  })

  // Messwerte nach jedem Turn übernehmen und die Limits für andere Sitzungen ablegen
  on('session.measure', async ($, e, next) => {
    await merken($, e.context.tokens, e.context.percent, e.rateLimits)
    await teilen($, e.rateLimits)
    return next(e)
  })

  // Subagents: Opus/Fable-Schritte auf das gewählte Modell umlenken
  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined && TEUER.test(e.model) && (await read($, aktiv))) {
      const modell = await read($, agentModell)
      return yield* next({ ...e, model: modell })
    }
    return yield* next(e)
  })

  // Eine Zeile mit "Prompt optimieren": die Zeile des Prompt-Optimierers um die Sparen-Knöpfe ergänzen.
  // Ist der Prompt-Optimierer nicht da, zeichnet die Leiste eine eigene Zeile.
  let kombiniert = false
  on('ui.render', { component: 'AbovePrompt', plugin: 'prompt-optimierer' }, async ($, e, next) => {
    const fremd = await next(e)
    if (e.props.hasSurvey) return fremd
    const { Box } = $.ui.resolve(e)
    if (!kombiniert) {
      kombiniert = true
      $.ui.invalidate('ui.render')
    }
    return (
      // Sparen-Knöpfe links, "Prompt optimieren" immer ganz rechts in der Zeile
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="100%" columnGap={2} flexWrap="nowrap">
        {await zeile($, e, e.props.isWorking)}
        <Box flexShrink={0}>{fremd}</Box>
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || kombiniert) return next(e)
    return zeile($, e, e.props.isWorking)
  })
}

async function zeile($: EngineInterface, e: Parameters<typeof $.ui.resolve>[0], laeuft: boolean) {
  {
    const istAktiv = await read($, aktiv)
    const modell = await read($, agentModell)
    const m = await read($, messung)
    const { Box, Button, Text } = $.ui.resolve(e)

    const umschalten = async () => {
      const neu = await update($, aktiv, v => !v)
      await $.store.set('aktiv', neu)
      await $.env.set('NORELVA_SPAREN_AUS', neu ? undefined : '1')
      $.ui.toast(neu ? 'Sparmodus an' : 'Sparmodus aus – alles läuft wie ohne Plugin', KURZ)
    }
    const modellWechseln = async () => {
      const neu = await update($, agentModell, v => FOLGE[(FOLGE.indexOf(v) + 1) % FOLGE.length] ?? 'sonnet')
      await $.store.set('agentModell', neu)
      $.ui.toast(HINWEIS[neu], KURZ)
    }
    const uebergabe = async () => {
      if (laeuft) {
        $.ui.toast('Erst wenn Claude fertig ist.', KURZ)
        return
      }
      await $.command.run({ command: 'norelva-sparen:uebergabe' })
    }

    // Kontextfarbe: Grün (leer) über Gelb zu Rot (voll)
    const prozent = m?.prozent ?? null
    const kontextFarbe = prozent === null ? undefined : ampel(prozent)

    return (
      <Box flexDirection="row" alignItems="center" columnGap={1} flexWrap="nowrap">
        <Button key="an" variant={istAktiv ? 'primary' : 'secondary'} label={istAktiv ? 'Sparen an' : 'Sparen aus'} onPress={umschalten} />
        {istAktiv ? (
          <Button key="modell" label={NAME[modell]} onPress={modellWechseln} />
        ) : null}
        <Button key="uebergabe" label="Übergabe" onPress={uebergabe} />
        {prozent !== null ? (
          <Text color={kontextFarbe} bold>Kontext {prozent} %</Text>
        ) : null}
        {m !== null && m.limit5h !== null ? (
          <Text><Text dimColor>Sitzung </Text><Text color={ampel(m.limit5h)}>{m.limit5h} %</Text></Text>
        ) : null}
        {m !== null && m.limit7d !== null ? (
          <Text><Text dimColor>Woche </Text><Text color={ampel(m.limit7d)}>{m.limit7d} %</Text></Text>
        ) : null}
      </Box>
    )
  }
}

async function merken(
  $: EngineInterface,
  tokens: number | undefined,
  prozent: number | undefined,
  limits: { kind: string; percentUsed: number }[],
) {
  const fuenf = limits.find(l => l.kind === 'five_hour')
  const sieben = limits.find(l => l.kind === 'seven_day')
  const wert: Messung = {
    tokens: tokens ?? null,
    prozent: prozent ?? null,
    limit5h: fuenf ? Math.round(fuenf.percentUsed) : null,
    limit7d: sieben ? Math.round(sieben.percentUsed) : null,
  }
  await update($, messung, () => wert)
}
