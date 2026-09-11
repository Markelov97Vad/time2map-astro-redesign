// Hosted admin for apps/server. Content lives in apps/web. Keystatic's local
// reader resolves paths relative to process.cwd() and sandboxes away "../", so
// the server must run with cwd = repo root (see the root dev:server/start:server
// scripts and --root apps/server). Paths are therefore prefixed with apps/web/.
// Schema is shared with apps/web via the factory in packages/keystatic-config.
import { buildKeystaticConfig } from '../../packages/keystatic-config/index';

export default buildKeystaticConfig({ prefix: 'apps/web/' });
