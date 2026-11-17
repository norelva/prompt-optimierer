export type Original = string | null

declare module 'claude-code' {
  interface PluginState {
    'prompt-optimierer': { isBusy: boolean; original: Original }
  }
}
