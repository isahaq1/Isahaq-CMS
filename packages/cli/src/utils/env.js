import fs from 'fs';
import path from 'path';

/**
 * Read .env file as a key→value map. Missing file returns {}.
 */
export function readEnv(dir) {
  const envPath = path.join(dir, '.env');
  if (!fs.existsSync(envPath)) return {};

  const map = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    map[key] = val;
  }
  return map;
}

/**
 * Write (merge) key→value pairs into .env.
 * Existing keys are updated in-place; new keys are appended.
 */
export function writeEnv(dir, vars) {
  const envPath = path.join(dir, '.env');
  let lines = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf8').split('\n')
    : [];

  const updated = new Set();

  // Update existing lines
  lines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return line;
    const key = trimmed.slice(0, eq).trim();
    if (key in vars) {
      updated.add(key);
      return `${key}="${vars[key]}"`;
    }
    return line;
  });

  // Append new keys
  const newKeys = Object.keys(vars).filter((k) => !updated.has(k));
  if (newKeys.length > 0) {
    lines.push('');
    lines.push('# Added by create-group-cms');
    for (const key of newKeys) {
      lines.push(`${key}="${vars[key]}"`);
    }
  }

  fs.writeFileSync(envPath, lines.join('\n').trimStart() + '\n', 'utf8');
  return envPath;
}
