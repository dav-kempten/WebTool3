/*
 * Schreibt src/app/build-info.ts mit Version und Zeitpunkt des Builds.
 *
 * Läuft über die npm-Hooks prebuild/prestart/pretest, damit die Datei in jeder
 * Umgebung existiert, bevor der Compiler sie sucht. Sie ist deshalb auch nicht
 * versioniert — ihr Inhalt gehört zum Build, nicht zum Quellstand.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// package.json braucht eine dreiteilige Version; angezeigt wird "2.0" statt
// "2.0.0", solange wir nur die mittlere Stelle hochzählen.
const display = version.replace(/\.0$/, '');
const builtAt = new Date().toISOString();

const target = join(root, 'src', 'app', 'build-info.ts');
writeFileSync(
  target,
  `/* Automatisch erzeugt von scripts/build-info.mjs — nicht von Hand ändern. */\n` +
    `export const BUILD_INFO = {\n` +
    `  version: '${display}',\n` +
    `  builtAt: '${builtAt}',\n` +
    `} as const;\n`,
  'utf8',
);

console.log(`build-info: Version ${display}, Stand ${builtAt}`);
