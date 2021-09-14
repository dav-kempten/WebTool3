.. _architecture:

WebTool3 - Aufbau und Funktionen
================================


..
  http://jpadilla.com/post/73791304724/auth-with-json-web-tokens
  
Datenmodell
-----------

Saison
~~~~~~

Für die Abgrenzung der verschiedenen Veranstaltungszeiträume wird eine Saison (``Season``) definiert.
Es gibt Objekte, die über die Jahre unverändert Verwendung finden (Siehe: ``SeasonsMixin``),
andere haben einen festen Bezug zu genau einer ``Season`` (Siehe: ``SeasonMixin``).

.. code-block:: python

    class Season(TimeMixin, models.Model):
        name = models.SlugField(
            'Bezeichnung',
            unique=True, max_length=4,
            help_text="Jahreszahl als Bezeichnung z.B. 2017"
        )
        current = models.BooleanField('Die aktuelle Saison', blank=True, default=False)
        params = postgres.JSONField(
            blank=True, null=True,
            default=defaults.get_default_params
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Saison"
            verbose_name_plural = "Saisonen"
            ordering = ('name', )

Das Attribut ``name`` enthält die Jahreszahl (z.B. 2016, 2017 oder 2018, ...).
Die aktuelle Saison wird mit ``current = True`` gekennzeichnet.
Freie Parameter z.B. für bestimmte Berechnungen werden im JSON Format in ``params`` abgelegt.

Kalender
~~~~~~~~

Die Zeiträume für Ferien (``Vacation``) und das Datum eines Gedenk- oder Feiertages (``Anniversary``)
werden zusammen mit einem Kalender (``Calendar``) verwaltet.

.. code-block:: python

    class Calendar(TimeMixin, models.Model):
        season = models.OneToOneField(
            'Season',
            primary_key=True, verbose_name='Saison', related_name='calendar',
            on_delete=models.PROTECT,
            blank=True, default=defaults.get_default_season
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Kalender"
            verbose_name_plural = "Kalender"
            ordering = ('season__name', )


    class Vacation(TimeMixin, models.Model):
        calendar = models.ForeignKey(
            'Calendar',
            db_index=True,
            verbose_name='Kalender', related_name='vacation_list',
            on_delete=models.PROTECT,
            blank=True, default=defaults.get_default_calendar
        )

        name = fields.NameField( verbose_name='Name', help_text=None)
        start_date = models.DateField('Beginn')
        end_date = models.DateField('Ende')

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Ferien"
            verbose_name_plural = "Ferien"
            unique_together = ('calendar', 'name')
            ordering = ('start_date', 'name')


    class Anniversary(TimeMixin, models.Model):
        calendars = models.ManyToManyField(
            'Calendar',
            db_index=True, verbose_name='Kalender',
            related_name='anniversary_list',
        )

        name = fields.NameField(verbose_name='Name', help_text=None)

        public_holiday = models.BooleanField(
            'Arbeitsfrei',
            blank=True, default=False
        )

        order = fields.OrderField()

        fixed_date = models.CharField(
            'Konstante',
            max_length=6,
            blank=True, null=True,
            help_text="Ein festes Datum im Format: TT.MM.",
        )

        day_occurrence = models.SmallIntegerField(
            'Zähloffset',
            choices=OCCURRENCE_CHOICES,
            blank=True, null=True,
            help_text="Ein bewegliches Datum, ein bestimmter (erste, zweite, ...) Wochentag im Monat",
        )

        weekday = models.PositiveSmallIntegerField(
            'Wochentag',
            choices=DAY_CHOICES,
            blank=True, null=True,
        )

        month = models.PositiveSmallIntegerField(
            'Monat',
            choices=MONTH_CHOICES,
            blank=True, null=True,
        )

        easter_offset = models.SmallIntegerField(
            'Osteroffset',
            blank=True, null=True
        )

        advent_offset = models.SmallIntegerField(
            'Adventoffset',
            blank=True, null=True,
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Gedenktag"
            verbose_name_plural = "Gedenktage"
            unique_together = ('name', 'public_holiday')
            ordering = ('order', 'name')

.. note::
    Fällt der vierte Advent in einem Jahr auf den 24.12. dann wird in der Tabelle ``Anniversary`` das Attribut
    ``deprecated = True`` für jeden Eintrag gesetzt, für den ein ``advent_offset == 21`` definiert ist.

    Die Regel besagt: Wenn der heilige Abend (24.12.) und der vierte Adventssonntag (21 Tage nach dem ersten
    Adventssonntag) auf das gleiche Datum fallen, dann wird als Kalendereintrag Heiligabend ausgegeben.

Hierarchie
~~~~~~~~~~

Alle Aktivitäten eines Jahres werden in der Sektion Allgäu Kempten in ein hierarchisches Ordnungssystem einsortiert.
Dieses Ordnungssystem orientiert sich z.B. an der Struktur der Homepage oder der eines gedruckten alpinen Terminkalenders.
Es gibt Kapitel (``Part``), Unterkapitel (``Section``) und Abschnitte (``Chapter``).

.. code-block:: python

    class Part(SeasonsMixin, TimeMixin, models.Model):
        name = fields.NameField(
            'Bezeichnung',
            unique=True,
            help_text="Bezeichnung des Abschnitts",
        )

        description =fields.DescriptionField(
            'Beschreibung',
            help_text="Beschreibung des Abschnitts",
            blank=True, default=''
        )

        order = fields.OrderField()

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Abschnitt"
            verbose_name_plural = "Abschnitte"
            ordering = ('order', 'name')


    class Section(TimeMixin, PartMixin, models.Model):
        name = fields.NameField(
            'Bezeichnung',
            help_text="Bezeichnung des Unterabschnitts",
        )

        description = fields.DescriptionField(
            'Beschreibung',
            help_text="Beschreibung des Unterabschnitts",
            blank=True, default=''
        )

        order = fields.OrderField()

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Unterabschnitt"
            verbose_name_plural = "Unterabschnitte"
            unique_together = ('part', 'name')
            ordering = ('order', 'name')


    class Chapter(TimeMixin, SectionMixin, models.Model):

        name = fields.NameField(
            'Bezeichnung',
            help_text="Bezeichnung des Kapitels",
        )

        description = fields.DescriptionField(
            'Beschreibung',
            help_text="Beschreibung des Kapitels",
            blank=True, default=''
        )

        order = fields.OrderField()

        class Meta:
            verbose_name = "Kapitel"
            verbose_name_plural = "Kapitel"
            unique_together = ('section', 'name')
            ordering = ('order', 'name')

Ein Vortrag (``Talk``), ein Gruppentermin (``Session``), ein Kurs (``Instruction``) oder eine
Gemeinschaftstour (``Tour``) haben ein Attribut ``chapter``, über welches sie einem oder mehreren Abschnitten zugeordnet
werden können.

Gemeinschaftstouren:
    Die Abschnitte für Gemeinschaftstouren ergeben sich aus der Kategorie der jeweiligen Tour (z.B. Bergtouren)
Kurse:
    Die Abschnitte für Kurse ergeben sich aus den Kursinhalten der jeweiligen Kurse (z.B. Grundkurs Alpinklettern)
Gruppentermine:
    Die Abschnitte für Gruppentermine ergeben sich aus dem Namen der jeweiligen Gruppe (z.B. Sektionsabende)
Vorträge:
    Für Vorträge gibt es bisher noch keine Regel für die Zuordnung von Kategorie und Abschnitt.

Veranstaltungstermin
~~~~~~~~~~~~~~~~~~~~

Die bisher aufgeführten Elemente (``Talk``, ``Session``, ``Instruction`` und ``Tour``) sind besondere Ausprägungen
eines zentralen Datentyps, dem Veranstaltungstermin  (``Event``).

Vortrag (``Talk``) und Gruppentermin (``Session``):
    | Ein Vortrag ist über das Attribut ``talk`` mit genau einem Veranstaltungstermin verbunden.
    | Ein Gruppentermin ist über das Attribut ``session`` mit genau einem Veranstaltungstermin verbunden.
Kurstermin (``Instruction``):
    Ein Kurs kann viele Veranstaltungstermine (z.B. einige Theorie- und/oder Praxisabende sowie längere Ausfahrten) benötigen.
    Es gibt aber genau einen Haupttermin, der über das Attribut ``instruction`` mit einem Veranstaltungstermin verbunden ist.
    Alle weiteren Kurstermine verweisen mit ihrem ``instruction`` Attribut zurück auf das jeweilige ``Instruction`` Objekt.
    Dort können alle untergeordneten Termine über das Attribut ``meeting_list`` bearbeitet werden.
Gemeinschaftstour (``Tour``):
    Eine Gemeinschaftstour hat in der Regel drei Veranstaltungstermine:

    * Der Anmeldeschluss (``deadline``) bezeichnet den Termin an dem die minimale Teilnehmerzahl erreicht sein sollte.
    * Die Vorbesprechung (``preliminary``) ist optional und kann z.B durch eine Telefonkonferenz oder eine Rundmail ersetzt werden.
    * Die Ausfahrt (``tour``) erstreckt sich über einen gewissen Zeitraum, von einigen Stunden bis zu mehreren Tagen.

.. code-block:: python

    class Event(SeasonMixin, TimeMixin, DescriptionMixin, models.Model):
        reference = models.OneToOneField(
            'Reference',
            primary_key=True,
            verbose_name='Buchungscode',related_name='event',
            on_delete=models.PROTECT,
        )

        location = fields.LocationField()

        reservation_service = models.BooleanField(
            'Reservierungswunsch für Schulungsraum',
            db_index=True,
            blank=True, default=False
        )

        start_date = models.DateField(
            'Abreisetag',
            db_index=True
        )

        start_time = models.TimeField(
            'Abreisezeit (Genau)',
            blank=True, null=True,
            help_text="Je nach Abreisezeit wird eventuell Urlaub benötigt",
        )

        # approximate is valid only if start_time is None
        approximate = models.ForeignKey(
            Approximate,
            db_index=True,
            verbose_name='Abreisezeit (Ungefähr)',
            related_name='event_list',
            blank=True, null=True,
            help_text="Je nach Abreisezeit wird eventuell Urlaub benötigt",
            on_delete=models.PROTECT,
        )

        end_date = models.DateField(
            'Rückkehr',
            blank=True, null=True,
            help_text="Nur wenn die Veranstaltung mehr als einen Tag dauert",
        )

        end_time = models.TimeField(
            'Rückkehrzeit',
            blank=True, null=True,
            help_text="z.B. Ungefähr bei Touren/Kursen - Genau bei Vorträgen",
        )

        link = models.URLField(
            'Beschreibung',
            blank=True, default='',
            help_text="Eine URL zur Veranstaltungsbeschreibung auf der Homepage",
        )

        map = models.FileField(
            'Kartenausschnitt',
            blank=True, default='',
            help_text="Eine URL zu einem Kartenausschnitt des Veranstaltungsgebietes",
        )

        distal = models.BooleanField(
            'Mit gemeinsamer Anreise',
            db_index=True,
            blank=True, default=False,
        )

        # rendezvous, source and distance valid only, if distal_event == True
        rendezvous = fields.LocationField(
            'Treffpunkt',
            help_text="Treffpunkt für die Abfahrt z.B. Edelweissparkplatz",
        )

        source = fields.LocationField(
            'Ausgangsort',
            help_text="Treffpunkt vor Ort",
        )

        public_transport = models.BooleanField(
            'Öffentliche Verkehrsmittel',
            db_index=True,
            blank=True, default=False
        )

        # distance valid only, if public_transport == False
        distance = fields.DistanceField()

        # lea valid only, if public_transport == True
        lea = models.BooleanField(
            'Low Emission Adventure',
            db_index=True,
            blank=True, default=False
        )

        new = models.BooleanField(
            'Markierung für Neue Veranstaltungen',
            db_index=True,
            blank=True, default=False
        )

        shuttle_service = models.BooleanField(
            'Reservierungswunsch für AlpinShuttle',
            db_index=True,
            blank=True, default=False
        )

        instruction = models.ForeignKey(
            'Instruction',
            db_index=True,
            blank=True, null=True,
            verbose_name='Kurs',
            related_name='meeting_list',
            on_delete=models.PROTECT,
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Veranstaltungstermin"
            verbose_name_plural = "Veranstaltungstermine"
            ordering = ('start_date', )

Vortrag
~~~~~~~

* Die Teilnehmerzahl kann begrenzt sein. => Buchungscode
* Es können Teilnehmerlisten geführt werden oder Eintrittskarten verkauft werden. => Buchungscode
* Die Veranstaltung kann auch für Nichtmitglieder offen stehen. => verschiedene Tarife

.. code-block:: python

    class Talk(TimeMixin, StateMixin, ChapterMixin, models.Model):
        talk = models.OneToOneField(
            Event,
            primary_key=True,
            verbose_name='Vortrag',
            related_name='talk',
            on_delete=models.PROTECT,
        )

        speaker = models.CharField(
            verbose_name='Referent',
            max_length=125,
            blank=True, default='',
            help_text="Name des Referenten",
        )

        admission = fields.AdmissionField(
            verbose_name='Beitrag für Mitglieder',
            help_text="Teilnehmerbeitrag in €"
        )

        min_quantity = models.PositiveIntegerField(
            'Min. Tln',
            blank=True, default=0,
            help_text="Wieviel Teilnehemr müssen mindestens teilnehmen",
        )

        max_quantity = models.PositiveIntegerField(
            'Max. Tln',
            blank=True, default=0,
            help_text="Wieviel Teilnehemr können maximal teilnehmen",
        )

        cur_quantity = models.PositiveIntegerField(
            'Anmeldungen',
            blank=True, default=0,
            help_text="Wieviel Teilnehemr sind aktuell angemeldet",
        )

        tariffs = models.ManyToManyField(
            'Tariff',
            db_index=True,
            verbose_name='Preisaufschläge',
            related_name='talk_list',
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Vortrag"
            verbose_name_plural = "Vortäge"
            ordering = ('talk__start_date', )

Gruppentermin
~~~~~~~~~~~~~

* Es können nur Gruppenmitglieder teilnehmen. => Kein Teilnehmerbeitrag
* Es gibt einen Ansprechpartner. => ``guide``
* Es kann Unterstützer im Team geben. => ``team``
* Jeder Gruppentermin gehört zu einer Gruppe. (``Collective``)

.. code-block:: python

    class Session(TimeMixin, GuidedEventMixin, RequirementMixin, EquipmentMixin, StateMixin, ChapterMixin, models.Model):
        collective = models.ForeignKey(
            Collective,
            db_index=True,
            verbose_name='Gruppe',
            related_name='session_list',
            on_delete=models.PROTECT,
        )

        categories = models.ManyToManyField(
            'Category',
            db_index=True,
            verbose_name='Weitere Kategorien',
            related_name='session_list',
            blank=True,
        )

        misc_category = models.CharField(
            'Sonstiges',
            max_length=75,
            blank=True, default='',
            help_text="Kategoriebezeichnung, wenn unter Kategorie „Sonstiges“ gewählt wurde",
        )

        ladies_only = models.BooleanField(
            'Von Frauen für Frauen',
            default=False,
        )

        session = models.OneToOneField(
            Event,
            primary_key=True,
            verbose_name='Veranstaltung',
            related_name='session',
            on_delete=models.PROTECT,
        )

        speaker = models.CharField(
            verbose_name='Referent',
            max_length=125,
            blank=True, default='',
            help_text="Name der/des Referenten",
            null=True,
        )

        portal = models.URLField(
            'Tourenportal',
            blank=True, default='',
            help_text="Eine URL zum Tourenportal der Alpenvereine",
        )

        message = models.TextField(blank=True, default='')
        comment = models.TextField(blank=True, default='')

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Gruppentermin"
            verbose_name_plural = "Gruppentermine"
            ordering = ('session__season__name', 'collective__name', 'session__start_date', )

Kurs
~~~~

* Die Teilnehmerzahl ist begrenzt. Es werden Teilnehmerlisten geführt. => Buchungscode
* Indoorkurse stehen auch Nichtmitgliedern offen. => verschiedene Tarife
* Es gibt einen Ansprechpartner. => ``guide``
* Es kann Unterstützer im Team geben. => ``team``
* Kurse können von Frauen exclusiv für Frauen veranstaltet werden. => ``ladies_only``

.. code-block:: python

    class Instruction(TimeMixin, GuidedEventMixin, AdminMixin, AdmissionMixin, ChapterMixin,
                      QualificationMixin, EquipmentMixin, models.Model):
    topic = models.ForeignKey(
            Topic,
            db_index=True,
            verbose_name='Inhalt',
            related_name='instructions',
            on_delete=models.PROTECT,
        )

        instruction = models.OneToOneField(
            Event,
            primary_key=True,
            verbose_name='Veranstaltung',
            related_name='meeting',
            on_delete=models.PROTECT,
        )

        ladies_only = models.BooleanField(
            'Von Frauen für Frauen',
            blank=True, default=False,
        )

        is_special = models.BooleanField(
            'Spezialkurs',
            blank=True, default=False,
            help_text = 'Kreative Kursinhalte'
        )

        # category is valid only, if instruction is_special
        category = models.OneToOneField(
            'Category',
            verbose_name='Sonder Kategorie',
            related_name='special_instruction',
            blank=True, null=True,
            on_delete=models.PROTECT,
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Kurs"
            verbose_name_plural = "Kurse"
            ordering = ('instruction__start_date', 'topic__order')

Gemeinschaftstour
~~~~~~~~~~~~~~~~~

* Die Teilnehmerzahl ist begrenzt. Es werden Teilnehmerlisten geführt. => Buchungscode
* Touren stehen nur Mitgliedern offen. => Eine Teilnehmergebühr ``admission``
* Es gibt einen Ansprechpartner. => ``guide``
* Es kann Unterstützer im Team geben. => ``team``
* Die Beherrschung bestimmter Kursinhalte kann notwendige Vorraussetzung für eine Teilnahme sein. => ``qualification_list``
* Touren können von Frauen exclusiv für Frauen veranstaltet werden. => ``ladies_only``

.. code-block:: python

    class Tour(TimeMixin, QualificationMixin, EquipmentMixin, GuidedEventMixin, ChapterMixin,
        AdminMixin, RequirementMixin, AdmissionMixin, models.Model):
        # Check: categories.season and self.season belongs to the same season!
        # Check: deadline <= preliminary < tour
        # Check: tour.category not part of categories

        categories = models.ManyToManyField(
            'Category',
            db_index=True,
            verbose_name='Weitere Kategorien',
            related_name='+',
            blank=True,
        )

        # misc_category is only valid if category is '?'

        misc_category = models.CharField(
            'Sonstiges',
            max_length=75,
            blank=True, default='',
            help_text="Kategoriebezeichnung, wenn unter Kategorie „Sonstiges“ gewählt wurde",
        )

        ladies_only = models.BooleanField(
            'Von Frauen für Frauen',
            default=False,
        )

        youth_on_tour = models.BooleanField(
            'Jugend on Tour',
            default=False,
        )

        relaxed = models.BooleanField(
            'Gemütliche Tour',
            default=False
        )

        deadline = models.OneToOneField(
            Event,
            verbose_name='Anmeldeschluss',
            related_name='deadline',
            on_delete=models.PROTECT,
        )

        preliminary = models.OneToOneField(
            Event,
            verbose_name='Tourenbesprechung',
            related_name='preliminary',
            blank=True, null=True,
            on_delete=models.SET_NULL,
        )

        # info is only valid if preliminary is None

        info = fields.InfoField(
            help_text="Informationen, wenn z.B. keine Tourenbesprechung geplant ist.",
        )

        tour = models.OneToOneField(
            Event,
            primary_key=True,
            verbose_name='Veranstaltung',
            related_name='tour',
            on_delete=models.PROTECT,
        )

        portal = models.URLField(
            'Tourenportal',
            blank=True, default='',
            help_text="Eine URL zum Tourenportal der Alpenvereine",
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Gemeinschaftstour"
            verbose_name_plural = "Gemeinschaftstouren"
            ordering = ('tour__start_date', )

Kennung, Kategorie, Buchungscode
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Jedem Veranstaltungstermin ist eine eindeutige Kennung (``Reference``) zugeordnet.
Für Touren (``Tour``), Kurse (``Instruction``) und Vorträge (``Talk``) wird diese Kennung als Buchungscode benutzt.
Über die Kennung ist ebenfalls jedem Veranstaltungstermin eine Kategorie (``Category``) zugeordnet.
Aus dieser Angabe leitet sich z.B. ab in welcher Jahreszeit (Winter oder Sommer) eine Veranstaltung stattfinden soll.
Im Winter werden nur Wintersportarten (z.B. Skitouren oder Schneeschuhtouren) angeboten.
Im Sommer werden eben nur Sommersportarten (z.B. Bergtouren oder Touren mit dem Moutainbike) angeboten.

.. code-block:: python

    class Category(SeasonsMixin, TimeMixin, models.Model):
        code = models.CharField(
            'Kurzzeichen',
            max_length=3,
            unique=True,
            help_text="Kurzzeichen der Kategorie",
        )

        name = fields.NameField(
            help_text="Bezeichnung der Kategorie",
        )

        order = fields.OrderField()

        tour = models.BooleanField(
            'Touren',
            db_index=True,
            blank=True, default=False,
            help_text = 'Kategorie für Touren'
        )

        deadline = models.BooleanField(
            'Anmeldeschluss',
            db_index=True,
            blank=True, default=False,
            help_text = 'Kategorie für den Anmeldeschluss'
        )

        preliminary = models.BooleanField(
            'Vorbesprechung',
            db_index=True,
            blank=True, default=False,
            help_text = 'Kategorie für die Vorbesprechung'
        )

        meeting = models.BooleanField(
            'Kurstermin',
            db_index=True,
            blank=True, default=False,
            help_text = 'Kategorie für Kurstreffen Theorie/Praxis'
        )

        talk = models.BooleanField(
            'Vorträge',
            db_index=True,
            blank=True, default=False,
            help_text = 'Kategorie für Vorträge'
        )

        topic = models.BooleanField(
            'Kurse',
            db_index=True,
            blank=True, default=False,
            help_text = 'Kategorie für Kurse'
        )

        # Check: A collective will define its own set of categories

        collective = models.BooleanField(
            'Gruppentermine',
            db_index=True,
            blank=True, default=False,
            help_text = 'Kategorie für Gruppentermine'
        )

        winter = models.BooleanField(
            'Wintersportart',
            db_index=True,
            blank=True, default=False
        )

        summer = models.BooleanField(
            'Sommersportart',
            db_index=True,
            blank=True, default=False
        )

        climbing = models.BooleanField(
            'Klettersportart',
            blank=True, default=False
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Kategorie"
            verbose_name_plural = "Kategorien"
            unique_together = ('code', 'name')
            ordering = ('order', 'code', 'name')


    class Reference(SeasonMixin, TimeMixin, models.Model):
        category = models.ForeignKey(
            'Category',
            db_index=True,
            verbose_name='Kategorie',
            related_name='event_list',
            on_delete=models.PROTECT,
        )

        reference = models.PositiveSmallIntegerField(
            verbose_name='Buchungscode',
            validators=[MaxValueValidator(99, 'Bitte keine Zahlen größer 99 eingeben')]
        )

        prefix = models.PositiveSmallIntegerField(
            verbose_name='Jahreszahl',
            validators=[MaxValueValidator(9, 'Bitte keine Zahlen größer 9 eingeben')],
            blank=True, default=defaults.get_default_prefix
        )

        class Meta:
            verbose_name = "Buchungscode"
            verbose_name_plural = "Buchungscodes"
            unique_together = ('season', 'category', 'prefix', 'reference')
            ordering = ('season__name', 'category__order', 'prefix', 'reference')

Gruppe
~~~~~~
Innerhalb der Sektion gibt es verschiedene Gruppen(``Collective``). Jede Gruppe setzt sich aus einer Kategorie (``category``) und
verschiedenen Gruppenleitern (``managers``) zusammen. Die Gruppenleiter sind dabei verschiedene Trainer, die mit der
Gruppe durch eine Rolle (``Role``) verbunden sind. Die Rollen sind die Verbindung zwischen den Trainern und den Gruppen.
Die Gruppen umfassen Vereinsorgane und als sowohl auch Kinder-, Jugend- und Erwachsenengruppen.

.. code-block:: python

    class Collective(SeasonsMixin, SectionMixin, TimeMixin, DescriptionMixin, models.Model):
        category = models.OneToOneField(
            'Category',
            primary_key=True,
            verbose_name='Kategorie',
            related_name='category_collective',
            on_delete=models.PROTECT,
        )

        managers = models.ManyToManyField(
            Guide, through="Role",
            db_index=True,
            verbose_name='Manager',
            related_name='collectives',
            blank=True,
            help_text="Ansprechpartner für die Gruppe",
        )

        order = fields.OrderField()

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Gruppe"
            verbose_name_plural = "Gruppen"
            unique_together = ('title', 'internal')
            ordering = ('order', 'name')

    class Role(TimeMixin, models.Model):
        collective = models.ForeignKey(
            Collective,
            db_index=True,
            verbose_name='Gruppe',
            related_name='role_list',
            on_delete=models.CASCADE,
        )

        manager = models.ForeignKey(
            Guide,
            db_index=True,
            verbose_name='Manager',
            related_name='role_list',
            on_delete=models.CASCADE,
        )

        order = fields.OrderField()
        description = fields.DescriptionField(blank=True, default='')

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Aufgabe"
            verbose_name_plural = "Aufgaben"
            ordering = ('order', 'manager__user__last_name', 'manager__user__first_name')

Abfahrts- und Ankunftszeiten
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Manchmal ist es nicht möglich eine genaue Abfahrts- oder Ankunftszeit anzugeben. Dafür gibt es das Modell ``Approximate``,
was eine ungefähre Einordnung der Zeiten ermöglicht. Alternativ ist es bei den einzelnen Touren, Kursen und Gruppenterminen
auch möglich eine genaue Startzeit einzugeben.

.. code-block:: python

    class Approximate(SeasonsMixin, TimeMixin, models.Model):

        name = fields.TitleField(
            db_index=True,
            unique=True,
            verbose_name='Kurzbeschreibung',
            help_text="Ungefährer Zeitpunkt",
        )

        description = fields.DescriptionField(
            help_text="Beschreibung des Zeitraums",
        )

        # Proposals
        # 'Morgens': '07:00',
        # 'Vormittags': '09:00',
        # 'Mittags': '12:00',
        # 'Nachmittags': '14:00',
        # 'Abends': '17:00'

        start_time = models.TimeField(
            'Abreisezeit (ungefähr)',
            help_text="Für die Kalkulation benötigte zeitliche Grundlage",
        )

        default = models.BooleanField(
            'Der initiale Zeitraum',
            blank=True, default=False
        )

        def natural_key(self):
            return self.name,

        natural_key.dependencies = ['server.season']

        def __str__(self):
            return self.name

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Ungefährer Zeitpunkt"
            verbose_name_plural = "Ungefähre Zeitpunkte"
            ordering = ('start_time', )

Ausrüstung
~~~~~~~~~~
Für verschiedene Veranstaltungen sind unterschiedliche Ausrüstungssets notwendig. Diese Ausrüstungssets sind bei allen
Touren, Kursen und Gruppenterminen die gleichen. Die Ausrüstungssets haben eine einzigartige Kennung (``code``) und
Namen (``name``).

.. code-block:: python

    class Equipment(SeasonsMixin, TimeMixin, models.Model):
        code = models.CharField(
            'Kurzzeichen',
            unique=True,
            max_length=10,
            help_text="Kurzzeichen für die Ausrüstung",
        )

        name = fields.NameField(
            'Bezeichnung',
            help_text="Bezeichnung der Ausrüstung",
        )

        description = fields.DescriptionField(
            'Beschreibung',
            help_text="Beschreibung der Ausrüstung",
        )

        default = models.BooleanField(
            'Die initiale Ausrüstung',
            blank=True, default=False
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Ausrüstung"
            verbose_name_plural = "Ausrüstungen"
            unique_together = ('code', 'name')
            ordering = ('code', )

Konditionelle Anforderungen
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Das ``Fitness``-Modell hilft bei der Einordung der konditionellen Schwierigkeit einer Tour und eines Kurses. Dabei gibt
es drei Fitness-Einträge die einer Kategorie zugeordnet werden können. Diese Einordung wird dann auch auf der Homepage
dargestellt.

.. code-block:: python

    class Fitness(SeasonsMixin, TimeMixin, models.Model):
        code = models.CharField(
            'Kurzbeschreibung',
            unique=True,
            max_length=3,
            help_text="Konditionelle Anforderungen",
        )

        order = fields.OrderField()

        default = models.BooleanField(
            'Die initiale konditionelle Anforderung',
            blank=True, default=False
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Konditionelle Anforderung"
            verbose_name_plural = "Konditionelle Anforderungen"
            ordering = ('order', 'code')


    class FitnessDescription(TimeMixin, models.Model):
        # SeasonMixin is needed only for namespace checking. See unique_together
        # check: fitness and category belongs to the same season!

        fitness = models.ForeignKey(
            Fitness,
            db_index=True,
            verbose_name='Konditionelle Anforderung',
            related_name='description_list',
            on_delete=models.PROTECT,
        )

        category = models.ForeignKey(
            Category,
            db_index=True,
            verbose_name='Kategorie',
            related_name='fitness_list',
            on_delete=models.PROTECT,
        )

        description = models.TextField(
            'Beschreibung',
            help_text="Beschreibung der Konditionelle Anforderung",
        )

        class Meta:
            get_latest_by = "updated"
            unique_together = ('fitness', 'category')
            verbose_name = "Beschreibung der Konditionelle Anforderung"
            verbose_name_plural = "Beschreibungen der Konditionelle Anforderungen"
            ordering = ('fitness__code', 'category__order')

Technische Anforderungen
~~~~~~~~~~~~~~~~~~~~~~~~
Das ``Skill``-Modell hilft bei der Einordung der technischen Schwierigkeit einer Tour und eines Kurses. Dabei gibt
es drei Skill-Einträge die einer Kategorie zugeordnet werden können. Diese Einordung wird dann auch auf der Homepage
dargestellt.

.. code-block:: python

    class Skill(SeasonsMixin, TimeMixin, models.Model):
        code = models.CharField(
            'Kurzbeschreibung',
            unique=True,
            max_length=3,
            help_text="Technische Anforderungen",
        )

        order = fields.OrderField()

        default = models.BooleanField(
            'Die initialen technische Anforderungen',
            blank=True, default=False
        )

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Technische Anforderung"
            verbose_name_plural = "Technische Anforderungen"
            ordering = ('order', 'code')


    class SkillDescription(TimeMixin, models.Model):
        # SeasonMixin is needed only for namespace checking. See unique_together
        # check skill and category belongs to the same season

        skill = models.ForeignKey(
            Skill,
            db_index=True,
            verbose_name='Technische Anforderung',
            related_name='description_list',
            on_delete=models.PROTECT,
        )

        category = models.ForeignKey(
            Category,
            db_index=True,
            verbose_name='Kategorie',
            related_name='skill_list',
            on_delete=models.PROTECT,
        )

        description = models.TextField(
            'Beschreibung',
            help_text="Beschreibung der technischen Anforderungen",
        )

        class Meta:
            get_latest_by = "updated"
            unique_together = ('skill', 'category')
            verbose_name = "Beschreibung der technischen Anforderung"
            verbose_name_plural = "Beschreibung der technischen Anforderungen"
            ordering = ('skill__code', 'category__order')

Kursinhalt
~~~~~~~~~~
Das ``Topic``-Modell verbindet die Kategorien mit den Kursen. Dabei unterschieden sich die Topics von Kategorien, dass
dadurch verschiedene Preisaufschläge für Nicht-Mitglieder, die auch bei Kursen der Sektion teilnehmen dürfen,
definiert werden können.

.. code-block:: python

    class Topic(SeasonsMixin, TimeMixin, DescriptionMixin, QualificationMixin, EquipmentMixin, models.Model):
        category = models.OneToOneField(
            'Category',
            primary_key=True,
            verbose_name='Kategorie',
            related_name='category_topic',
            on_delete=models.PROTECT,
        )

        tariffs = models.ManyToManyField(
            'Tariff',
            db_index=True,
            verbose_name='Preisaufschläge',
            related_name='tariff_list',
            blank=True, default=''
        )

        order = fields.OrderField()

        class Meta:
            get_latest_by = "updated"
            verbose_name = "Kursinhalt"
            verbose_name_plural = "Kursinhalte"
            unique_together = ('title', 'internal')
            ordering = ('order', 'name')

Preisgruppen
~~~~~~~~~~~~
Die Tariffe erlauben eine Unterscheidung von Preisen für Mitglieder und Nicht-Migliedern, da Kurse und andere
Veranstaltungen für Mitglieder meist günstiger sind.

.. code-block:: python

    class Tariff(SeasonMixin, TimeMixin, models.Model):
        name = fields.NameField(
            'Bezeichnung',
            help_text="Bezeichnung der Preisgruppe",
        )

        description = fields.DescriptionField(
            'Beschreibung',
            help_text="Beschreibung des Preisgruppe",
            blank=True, default=''
        )

        order = fields.OrderField()

        multiplier = models.DecimalField(
            'Preisaufschlag',
            max_digits=6, decimal_places=3,
            blank=True, default=0.0,
            help_text='Preisaufschlag auf Mitgliederpreise'
        )

        class Meta:
            verbose_name = "Preisgruppe"
            verbose_name_plural = "Preisgruppen"
            unique_together = ('season', 'name')
            ordering = ('season__name', 'order', 'name')

Bearbeitungsstände
~~~~~~~~~~~~~~~~~~

.. code-block:: python

    class ServerState(models.Model):
        season = models.ForeignKey(ServerSeason)

        name = models.CharField(max_length=30)
        description = models.TextField()

        default = models.BooleanField()
        public = models.BooleanField()
        canceled = models.BooleanField()
        moved = models.BooleanField()
        unfeasible = models.BooleanField()
        done = models.BooleanField()

        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_state'
            unique_together = (('season', 'name'),)

Trainer
~~~~~~~

.. code-block:: python

    class ServerGuide(models.Model):
        season = models.ForeignKey('ServerSeason')
        user = models.ForeignKey(AuthUser, primary_key=True)

        first_name = models.CharField(max_length=30)
        last_name = models.CharField(max_length=30)
        profile = postgres.JSONField(blank=True, null=True)
        portrait = models.CharField(max_length=100)

        email = models.CharField(max_length=254)
        phone = models.CharField(max_length=75)
        mobile = models.CharField(max_length=75)

        unknown = models.BooleanField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_guide'
            unique_together = (('season', 'first_name', 'last_name'),)

Personalverwaltung
------------------

Steckbrief eines Trainers
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    class ServerProfile(models.Model):
        user = models.ForeignKey(AuthUser, primary_key=True)
        sex = models.SmallIntegerField()
        birth_date = models.DateField(blank=True, null=True)

        phone = models.CharField(max_length=75)
        mobile = models.CharField(max_length=75)

        member_id = models.CharField(unique=True, max_length=13, blank=True, null=True)
        member_year = models.IntegerField(blank=True, null=True)
        integral_member = models.BooleanField()
        member_home = models.CharField(max_length=70)

        note = models.TextField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_profile'

DAV Ausbildungsgänge
~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    class ServerQualification(models.Model):
        code = models.CharField(unique=True, max_length=10)
        name = models.CharField(max_length=125)
        group = models.ForeignKey('ServerQualificationgroup', blank=True, null=True)

        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_qualification'
            unique_together = (('code', 'group'), ('code', 'name'),)

Gruppierung der Qualifikationen
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    class ServerQualificationgroup(models.Model):
        name = models.CharField(unique=True, max_length=125)

        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_qualificationgroup'

Qualifikationen eines Trainers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    class ServerUserqualification(models.Model):
        qualification = models.ForeignKey(ServerQualification)
        user = models.ForeignKey(AuthUser)

        year = models.SmallIntegerField()

        aspirant = models.BooleanField()
        inactive = models.BooleanField()

        note = models.TextField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_userqualification'
            unique_together = (('user', 'qualification', 'year'),)

Fortbildungen eines Trainers
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    class ServerRetraining(models.Model):
        qualification = models.ForeignKey('ServerUserqualification', blank=True, null=True)

        year = models.IntegerField()
        specific = models.BooleanField()

        description = models.TextField()
        note = models.TextField(blank=True, null=True)

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_retraining'
