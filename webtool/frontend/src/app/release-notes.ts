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
    version: '2.2.3',
    changes: [
      'Touren, Kurse und Gruppentermine: Der Treffpunkt bietet über den Pfeil neben dem Feld „Alpinzentrum Kempten, Seminarraum“ und „Alpinzentrum Kempten, Parkplatz“ zur Auswahl an. Alles andere lässt sich wie bisher frei eintragen, mit höchstens 75 Zeichen.',
      'Start- und Endzeit lassen sich eintippen oder über den Uhr-Knopf auswählen. Getippte Zeiten werden vereinheitlicht, aus „930“ wird z. B. 09:30.',
      'Auf der Homepage stehen Treffpunkt, Kursort und Übernachtung eines Kurses jetzt beschriftet: beim ersten Termin je in einer eigenen Zeile unter „Termin:“ bzw. „Abfahrt:“, bei den weiteren Terminen in der jeweiligen Terminzeile. Der Kursort erscheint dort jetzt auch bei den weiteren Terminen.',
      'Für die Geschäftsstelle steht im Termin-Dialog eines Kurses unter diesen Feldern, wo sie auf der Homepage landen.',
      'Auf der Homepage, im Programmheft und im Ausdruck heißt es jetzt „Teilnahmegebühr“ statt „Teilnehmergebühr“.',
      'Auf dem Dashboard stehen „Meine Touren“ und „Meine Kurse“ jetzt über dem Bedarf der Saison.',
      'Gruppenleiter, Fachbereichssprecher und Geschäftsstelle können auf dem Dashboard über „Neuer Gruppentermin“ direkt einen Termin anlegen, wie bei Touren und Kursen. Gruppenleiter sehen dabei nur ihre eigenen Gruppen.',
      'Das Feld „Ausgangsort“ im Tourformular heißt jetzt „Ausgangspunkt“, wie auf der Homepage und im Programmheft. Im Programmheft stehen bei Kursen Treffpunkt, Kursort und Übernachtung jetzt so beschriftet wie auf der Homepage.',
      'Kurstermine ohne Start- und Tageszeit zeigen auf der Homepage wieder ihr Datum. Bisher fehlte es dort, und die Zeile begann mit einem Komma.',
      'In Beschreibungen bleiben die üblichen Formatierungen erhalten: Zeilenumbruch, fett, kursiv, Absätze, Listen und Links. Andere HTML-Befehle werden auf der Homepage entfernt, alle übrigen Felder erscheinen dort genau so, wie sie eingetippt wurden.',
      'Start- und Endzeit: Der Uhr-Knopf bietet nur noch Viertelstunden an. Eine Uhrzeit, die sich nicht lesen lässt, wird rot markiert, und darunter steht, wie sie aussehen muss.',
    ],
  },
  {
    version: '2.2.2',
    changes: [
      'Die Termin-Details eines Kurses führen jetzt wie bei den Touren Low Emission Adventure, Gemeinschaftsanreise, Öffentliche Anreise und Alpin-Shuttle — am Haupttermin des Kurses.',
      'Ist das Alpin-Shuttle angehakt, steht der Reservierungswunsch auch beim Kurs unter der Nachricht an die Geschäftsstelle.',
      'Touren und Kurse lassen sich als Übernachtung kennzeichnen: „Übernachtungstour“ bei den Tourenspezifika, „Kurs mit Übernachtung“ bei den Kursspezifika.',
      'Bei mehrtägigen Touren und Kursen fragt die Checkliste vor „Fertig“, ob übernachtet wird und der Haken gesetzt ist.',
      '„Ausdruck“ im Touren- und Kursformular speichert und lädt die Tour bzw. den Kurs mit allen Angaben als PDF im Stil des Programmhefts – zum Abheften. Neu auch für Kurse.',
    ],
  },
  {
    version: '2.2.1',
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
