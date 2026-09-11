import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

const exec = promisify(execCb);

/** Repo root. The server runs with cwd = repo root (see root scripts); override
 *  with REPO_ROOT if you run it from elsewhere. */
const REPO_ROOT = process.env.REPO_ROOT ?? process.cwd();

export interface StepResult {
  step: string;
  ok: boolean;
  output: string;
}

export interface PublishResult {
  ok: boolean;
  steps: StepResult[];
}

const tail = (s: string, n = 4000) => (s.length > n ? s.slice(-n) : s);

async function run(step: string, command: string): Promise<StepResult> {
  try {
    const { stdout, stderr } = await exec(command, {
      cwd: REPO_ROOT,
      timeout: 5 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { step, ok: true, output: tail((stdout + stderr).trim()) };
  } catch (err: any) {
    const out = `${err?.stdout ?? ''}${err?.stderr ?? ''}`.trim() || String(err?.message ?? err);
    return { step, ok: false, output: tail(out) };
  }
}

/**
 * Publish pipeline: stage and commit content edited through the admin, then
 * rebuild the static site (which also runs the SEO audit). The commit is
 * best-effort (a clean tree or unconfigured git author is not fatal); the
 * rebuild must succeed for the publish to be considered OK.
 *
 * Phase 5 will add the atomic dist swap + nginx reload around this.
 */
export async function publish(): Promise<PublishResult> {
  const steps: StepResult[] = [];

  steps.push(await run('stage', 'git add apps/web/src/content apps/web/public'));

  // Commit only if something is staged; never fail the publish on "nothing to commit".
  const commit = await run(
    'commit',
    'git diff --cached --quiet || git commit -m "content: update via admin"'
  );
  steps.push(commit);

  const build = await run('build', 'npm run build -w @time2map/web');
  steps.push(build);
  if (!build.ok) return { ok: false, steps };

  // On the server, atomically swap the freshly-built dist into the directory
  // nginx serves (PUBLISH_DIR/current). Skipped locally when PUBLISH_DIR is unset.
  if (import.meta.env.PUBLISH_DIR ?? process.env.PUBLISH_DIR) {
    const swap = await run('deploy', 'bash deploy/swap-dist.sh');
    steps.push(swap);
    return { ok: swap.ok, steps };
  }

  return { ok: true, steps };
}
