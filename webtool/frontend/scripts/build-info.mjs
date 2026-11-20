/*
 * Schreibt src/app/build-info.ts mit Version und Zeitpunkt des Builds.
 *
 * Zwei Betriebsarten:
 *
 *   ohne Argument  Darauf laufen die Hooks prebuild/prestart/pretest. Die
 *                  Version folgt immer package.json; der Zeitpunkt bleibt der
 *                  des letzten "npm run package". Fehlt die Datei, wird sie
 *                  mit der aktuellen Uhrzeit angelegt.
 *   --stamp        Schreibt Version und aktuelle Uhrzeit. Nur "npm run
 *                  package" ruft das auf, damit der angezeigte Zeitpunkt den
 *                  ausgelieferten Stand meint und nicht den letzten Testbau.
 *
 * Früher ließ die erste Betriebsart eine vorhandene Datei ganz in Ruhe — dann
 * blieb nach dem Anheben der Version auch die alte Versionsnummer stehen, und
 * localhost zeigte samt Release Notes noch die Vorgängerversion.
 *
 * Die Datei ist nicht versioniert: ihr Inhalt gehört zum Build, nicht zum
 * Quellstand.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'src', 'app', 'build-info.ts');
const stamp = process.argv.includes('--stamp');

// Die Version wird genommen, wie sie in package.json steht. Früher fiel ein
// abschließendes ".0" weg, damit "2.0.0" als "2.0" erschien -- das passte
// nicht mehr, sobald ein Release ausdrücklich 2.1.0 heißt.
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** Version und Zeitpunkt aus einer vorhandenen Datei, sonst null. */
function readExisting() {
  if (!existsSync(target)) {
    return null;
  }
  const text = readFileSync(target, 'utf8');
  return {
    version: /version: '([^']*)'/.exec(text)?.[1] ?? null,
    builtAt: /builtAt: '([^']*)'/.exec(text)?.[1] ?? null,
  };
}

const existing = stamp ? null : readExisting();

if (existing?.version === version && existing.builtAt) {
  console.log(`build-info: Version ${version} aktuell, Zeitstempel bleibt`);
  process.exit(0);
}

const builtAt = existing?.builtAt ?? new Date().toISOString();

writeFileSync(
  target,
  `/* Automatisch erzeugt von scripts/build-info.mjs — nicht von Hand ändern. */\n` +
    `export const BUILD_INFO = {\n` +
    `  version: '${version}',\n` +
    `  builtAt: '${builtAt}',\n` +
    `} as const;\n`,
  'utf8',
);

if (stamp) {
  console.log(`build-info: Version ${version}, Stand ${builtAt}`);
} else if (existing) {
  console.log(`build-info: Version ${existing.version} → ${version}, Zeitstempel bleibt (${builtAt})`);
} else {
  console.log(`build-info: angelegt (Version ${version})`);
}
