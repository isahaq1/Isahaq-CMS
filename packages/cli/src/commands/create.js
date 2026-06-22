import {
  text, select, confirm, spinner, note, outro, isCancel, cancel,
} from '@clack/prompts';
import { execa } from 'execa';
import gradient from 'gradient-string';
import pc from 'picocolors';
import path from 'path';
import fs from 'fs';
import { runSetup } from './setup.js';
import { runMigrate } from './migrate.js';

const REPO_URL = 'https://github.com/isahaq1/Isahaq-CMS.git';
const TOTAL_STEPS = 4;

function step(n, label) {
  return `${pc.dim(`[${n}/${TOTAL_STEPS}]`)} ${label}`;
}

// Live elapsed-time spinner: updates message every second with running duration
function startTimedSpinner(s, baseMsg) {
  const started = Date.now();
  const timer = setInterval(() => {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    s.message(`${baseMsg} ${pc.dim(`${elapsed}s`)}`);
  }, 1000);
  return {
    stop: (msg) => { clearInterval(timer); s.stop(msg); },
    elapsed: () => ((Date.now() - started) / 1000).toFixed(1),
  };
}

export async function runCreate(nameArg) {
  // ── Project name ─────────────────────────────────────────────────────────────
  const projectName = nameArg || await text({
    message: 'Project name',
    placeholder: 'my-cms',
    defaultValue: 'my-cms',
    validate: (v) => {
      if (!v.trim()) return 'Required';
      if (!/^[a-z0-9-_]+$/i.test(v)) return 'Use only letters, numbers, hyphens, underscores';
    },
  });
  if (isCancel(projectName)) return cancel('Setup cancelled.');

  const projectDir = path.resolve(process.cwd(), projectName);

  // ── Check destination ────────────────────────────────────────────────────────
  if (fs.existsSync(projectDir)) {
    const files = fs.readdirSync(projectDir);
    if (files.length > 0) {
      const overwrite = await confirm({
        message: `Directory "${projectName}" is not empty. Continue anyway?`,
        initialValue: false,
      });
      if (isCancel(overwrite) || !overwrite) return cancel('Cancelled.');
    }
  }

  // ── Package manager ──────────────────────────────────────────────────────────
  const pkgManager = await select({
    message: 'Package manager',
    options: [
      { value: 'npm',  label: 'npm  (recommended)' },
      { value: 'pnpm', label: 'pnpm (fast)' },
      { value: 'yarn', label: 'yarn v1' },
    ],
  });
  if (isCancel(pkgManager)) return cancel('Cancelled.');

  console.log('');

  // ── [1/4] Clone repo ─────────────────────────────────────────────────────────
  const s = spinner();
  s.start(step(1, `Downloading Group CMS into ${pc.cyan(projectName)}…`));
  const cloneTimer = startTimedSpinner(s, step(1, `Downloading Group CMS into ${pc.cyan(projectName)}…`));
  try {
    await execa('git', ['clone', '--depth=1', REPO_URL, projectDir]);
    fs.rmSync(path.join(projectDir, '.git'), { recursive: true, force: true });
    cloneTimer.stop(pc.green(`✓ Project downloaded`) + pc.dim(` in ${cloneTimer.elapsed()}s`));
  } catch (err) {
    cloneTimer.stop(pc.red('✗ Clone failed'));
    note(
      `Make sure git is installed and you have internet access.\nRepo: ${REPO_URL}`,
      pc.red('Failed')
    );
    console.error(pc.dim(err.message));
    process.exit(1);
  }

  // ── [2/4] Database setup ──────────────────────────────────────────────────────
  console.log('');
  console.log(pc.dim(`  ─── ${step(2, 'Configure database')} ────────────────────────────`));
  console.log('');
  await runSetup(projectDir);

  // ── [3/4] Install dependencies ───────────────────────────────────────────────
  console.log('');
  s.start(step(3, 'Installing dependencies…'));
  const installTimer = startTimedSpinner(s, step(3, 'Installing dependencies…'));
  const installCmd = pkgManager === 'yarn' ? 'yarn' : pkgManager;
  try {
    await execa(installCmd, ['install'], { cwd: projectDir });
    const elapsed = installTimer.elapsed();
    installTimer.stop(pc.green('✓ Dependencies installed') + pc.dim(` in ${elapsed}s`));
  } catch (err) {
    installTimer.stop(pc.red('✗ Install failed'));
    console.error(pc.dim(err.message));
    process.exit(1);
  }

  // ── Build shared package ─────────────────────────────────────────────────────
  s.start('  Building shared types…');
  try {
    await execa(installCmd, ['run', 'build', '--workspace=@group-cms/shared'], { cwd: projectDir });
    s.stop(pc.green('  ✓ Shared types built'));
  } catch {
    s.stop(pc.yellow('  ⚠ Shared build skipped — run `npm run build` manually if needed'));
  }

  // ── [4/4] Migrations ─────────────────────────────────────────────────────────
  const doMigrate = await confirm({
    message: step(4, 'Run database migrations and seed now?'),
    initialValue: true,
  });
  if (!isCancel(doMigrate) && doMigrate) {
    console.log('');
    await runMigrate(projectDir);
  }

  // ── Done ──────────────────────────────────────────────────────────────────────
  const run = pkgManager === 'npm' ? 'npm run' : pkgManager;

  console.log('');
  note(
    [
      gradient.cristal('  Your CMS is ready!'),
      '',
      `  ${pc.bold('Project')}   ${pc.cyan(projectName)}`,
      `  ${pc.bold('Database')} configured in ${pc.dim('.env')}`,
      '',
      `  ${pc.bold('Next steps:')}`,
      '',
      `    ${pc.dim('$')} ${pc.cyan(`cd ${projectName}`)}`,
      `    ${pc.dim('$')} ${pc.cyan(`${run} dev`)}`,
      '',
      `  Then open ${pc.underline('http://localhost:3000')} in your browser`,
      `  API runs at   ${pc.underline('http://localhost:4000')}`,
    ].join('\n'),
    pc.green('✓ Done')
  );

  outro(pc.dim('Happy building!'));
}
