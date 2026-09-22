import { definePlugin } from 'nitro'
import { createAppConfig } from '../config.server'
import { closePublishedConnections } from './shutdown-handle'

// ═══════════════════════════════════════════════════════════════════════════
//   The env is parsed here so a bad deploy crashes before listening; `close`
//   runs after the server drains.
// ═══════════════════════════════════════════════════════════════════════════
export default definePlugin((nitroApp) => {
	createAppConfig()

	nitroApp.hooks.hook('close', closePublishedConnections)
})
