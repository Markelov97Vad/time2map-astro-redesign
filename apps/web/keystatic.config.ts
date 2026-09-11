// Dev-only admin for apps/web. Content lives in this app, so no path prefix.
// The schema itself is shared with apps/server (the hosted admin) via the
// factory in packages/keystatic-config.
import { buildKeystaticConfig } from '../../packages/keystatic-config/index';

export default buildKeystaticConfig();
