/*
 * Was eine Version gegenüber ihrer Vorgängerin bringt — von Hand gepflegt,
 * neueste zuerst. Die Fußzeile zeigt den Eintrag, dessen Version zur gebauten
 * passt (siehe build-info.ts); fehlt er, bleibt der Infobutton aus.
 *
 * Beim Anheben der Version in package.json also hier einen Eintrag ergänzen,
 * in der Sprache der Leiterinnen und Leiter, nicht in der des Commits. Auch
 * Kleinigkeiten gehören hinein: wer den Knopf drückt, will wissen, was sich
 * geändert hat, und nicht raten, ob eine Abweichung Absicht war.
 */
export interface ReleaseNote {
  version: string;
  changes: string[];
}

export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    version: '2.3.0',
    changes: [
      'Der Termin-Dialog eines Gruppentermins kennt wieder einen Kurztitel — er steht in der Terminliste und im Programm auf der Homepage; bisher ließ er sich gar nicht eintragen.',
      'Der Kurztitel erscheint in der Terminliste, sobald der Dialog übernommen ist, und nicht erst nach dem Speichern.',
      'Neben dem Kurztitel führt der Dialog jetzt auch Schulungsraum, Gemeinschaftsanreise, Alpin-Shuttle, Gesamtfahrstrecke und die Kartenausschnitt-URL.',
      'Startzeit und Tageszeit schließen sich aus: Die eine sperrt die andere, wie bei Touren und Kursen schon länger.',
      'Ein neuer Gruppentermin lässt sich nur noch auf ein Datum in der Zukunft legen.',
      'Die Fußzeile hat rechts einen Infobutton mit den Änderungen der laufenden Version — den, der diese Liste zeigt.',
    ],
  },
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
      'Das Dashboard zeigt, was der Saison noch fehlt.',
      'Diese Bedarfsansicht ist in aufklappbare Saison-Blöcke geteilt und als Beta gekennzeichnet.',
      'Sie schaltet am 1. September auf die kommende Saison um, nicht erst später.',
      'Neuer Support-Kasten auf dem Dashboard, um Probleme zu melden — mit der Feldaufteilung der übrigen Formulare.',
      'Die Überschrift des Support-Kastens fluchtet mit seinen Feldern und benennt, was mitgeschickt wird.',
      'Der Support-Kasten lässt sich zuklappen; die Fußzeile ist signiert.',
      'Das Kursformular hat das Feld „Kursort“ zurück.',
      'Die Saison beginnt am 1. Dezember statt am 1. Januar.',
      'Das Einrichten der Voraussetzungen nennt beim Durchlauf die internen Themen, die es überspringt.',
    ],
  },
] as const;
