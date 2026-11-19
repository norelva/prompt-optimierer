export type AgentModell = 'sonnet' | 'haiku' | 'opus' | 'fable'
export type Messung = {
  tokens: number | null
  prozent: number | null
  limit5h: number | null
  limit7d: number | null
} | null

declare module 'claude-code' {
  interface PluginState {
    'norelva-sparen-leiste': {
      aktiv: boolean
      agentModell: AgentModell
      messung: Messung
    }
  }
}
