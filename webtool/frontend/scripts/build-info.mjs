/*
 * Schreibt src/app/build-info.ts mit Version und Zeitpunkt des Builds.
 *
 * Zwei Betriebsarten:
 *
 *   ohne Argument  Legt die Datei nur an, wenn sie fehlt. Darauf laufen die
 *                  Hooks prebuild/prestart/pretest — sie sollen nur
 *                  sicherstellen, dass der Compiler sie findet.
 *   --stamp        Schreibt sie neu mit der aktuellen Uhrzeit. Nur "npm run
 *                  package" ruft das auf, damit der angezeigte Zeitpunkt den
 *                  ausgelieferten Stand meint und nicht den letzten Testbau.
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

if (!stamp && existsSync(target)) {
  console.log('build-info: vorhanden, Zeitstempel bleibt');
  process.exit(0);
}

const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// package.json braucht eine dreiteilige Version; angezeigt wird "2.0" statt
// "2.0.0", solange wir nur die mittlere Stelle hochzählen.
const display = version.replace(/\.0$/, '');
const builtAt = new Date().toISOString();

writeFileSync(
  target,
  `/* Automatisch erzeugt von scripts/build-info.mjs — nicht von Hand ändern. */\n` +
    `export const BUILD_INFO = {\n` +
    `  version: '${display}',\n` +
    `  builtAt: '${builtAt}',\n` +
    `} as const;\n`,
  'utf8',
);

console.log(
  stamp
    ? `build-info: Version ${display}, Stand ${builtAt}`
    : `build-info: angelegt (Version ${display})`,
);
