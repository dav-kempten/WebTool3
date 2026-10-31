/*
 * Was eine Version gegenüber ihrer Vorgängerin bringt — von Hand gepflegt,
 * neueste zuerst. Die Fußzeile zeigt den Eintrag, dessen Version zur gebauten
 * passt (siehe build-info.ts); fehlt er, bleibt der Infobutton aus.
 *
 * Beim Anheben der Version in package.json also hier einen Eintrag ergänzen,
 * in der Sprache der Leiterinnen und Leiter, nicht in der des Commits.
 */
export interface ReleaseNote {
  version: string;
  changes: string[];
}

export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    version: '2.2.0',
    changes: [
      'Angular und PrimeNG auf einen Stand ohne offene Sicherheitshinweise gehoben.',
      'Die Python-Pakete des Servers ebenso aktualisiert.',
      'Die Fußzeile zeigt die Versionsnummer wieder vollständig an (2.1.0 statt 2.1).',
    ],
  },
  {
    version: '2.1.0',
    changes: [
      'Das Dashboard zeigt, was der Saison noch fehlt — nach Saison aufklappbar und als Beta gekennzeichnet.',
      'Neuer Support-Kasten auf dem Dashboard, um Probleme direkt zu melden; er lässt sich zuklappen.',
      'Das Kursformular hat das Feld „Kursort“ zurück.',
      'Die Saison beginnt am 1. Dezember statt am 1. Januar; die Bedarfsansicht schaltet dafür am 1. September um.',
    ],
  },
] as const;
