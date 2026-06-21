import {
  text, select, confirm, spinner, note, outro, isCancel, cancel,
} from '@clack/prompts';
import { execa } from 'execa';
import pc from 'picocolors';
import path from 'path';
import fs from 'fs';
import { runSetup } from './setup.js';
import { runMigrate } from './migrate.js';

const REPO_URL = 'https://github.com/your-org/group-cms.git';

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
      { value: 'npm',  label: 'npm' },
      { value: 'pnpm', label: 'pnpm' },
      { value: 'yarn', label: 'yarn (v1)' },
    ],
  });
  if (isCancel(pkgManager)) return cancel('Cancelled.');

  // ── Clone repo ───────────────────────────────────────────────────────────────
  const s = spinner();

  s.start(`Cloning Group CMS into ${pc.cyan(projectName)}…`);
  try {
    await execa('git', ['clone', '--depth=1', REPO_URL, projectDir]);
    // Remove the .git directory so it becomes a fresh project
    fs.rmSync(path.join(projectDir, '.git'), { recursive: true, force: true });
    s.stop(pc.green('✓ Project files downloaded'));
  } catch (err) {
    s.stop(pc.red('✗ Clone failed'));
    console.error(err.message);
    note(
      'Make sure git is installed and you have internet access.\n' +
      `Repo: ${REPO_URL}`,
      'Failed'
    );
    process.exit(1);
  }

  // ── Database setup ───────────────────────────────────────────────────────────
  console.log('');
  await runSetup(projectDir);

  // ── Install dependencies ─────────────────────────────────────────────────────
  s.start('Installing dependencies…');
  const installCmd = pkgManager === 'yarn' ? 'yarn' : pkgManager;
  try {
    await execa(installCmd, ['install'], { cwd: projectDir });
    s.stop(pc.green('✓ Dependencies installed'));
  } catch (err) {
    s.stop(pc.red('✗ Install failed'));
    console.error(err.message);
    process.exit(1);
  }

  // ── Build shared package ─────────────────────────────────────────────────────
  s.start('Building shared types…');
  try {
    await execa(installCmd, ['run', 'build', '--workspace=@group-cms/shared'], { cwd: projectDir });
    s.stop(pc.green('✓ Shared package built'));
  } catch {
    s.stop(pc.yellow('⚠ Could not build shared package — run `npm run build` manually'));
  }

  // ── Migrations ───────────────────────────────────────────────────────────────
  const doMigrate = await confirm({
    message: 'Run database migrations and seed now?',
    initialValue: true,
  });
  if (!isCancel(doMigrate) && doMigrate) {
    await runMigrate(projectDir);
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  const run = pkgManager === 'npm' ? 'npm run' : pkgManager;
  outro(
    pc.green('✓ All done!') + '\n\n' +
    '  Next steps:\n' +
    pc.cyan(`  cd ${projectName}\n`) +
    pc.cyan(`  ${run} dev`) + '\n\n' +
    '  Then open ' + pc.underline('http://localhost:3000') + ' in your browser.'
  );
}
