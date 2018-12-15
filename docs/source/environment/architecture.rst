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

    class ServerSeason(models.Model):
        name = models.CharField(unique=True, max_length=4)
        current = models.BooleanField()
        params = postgres.JSONField(blank=True, null=True)

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_season'

Das Attribut ``name`` enthält die Jahreszahl (z.B. 2016, 2017 oder 2018, ...).
Die aktuelle Saison wird mit ``current = True`` gekennzeichnet.
Freie Parameter z.B. für bestimmte Berechnungen werden im JSON Format in ``params`` abgelegt.

Kalender
~~~~~~~~

Die Zeiträume für Ferien (``Vacation``) und das Datum eines Gedenk- oder Feiertages (``Anniversary``)
werden zusammen mit einem Kalender (``Calendar``) verwaltet.

.. code-block:: python

    class ServerCalendar(models.Model):
        season = models.ForeignKey('ServerSeason', primary_key=True)

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_calendar'


    class ServerVacation(models.Model):
        calendar = models.ForeignKey(ServerCalendar)

        name = models.CharField(max_length=125)
        start_date = models.DateField()
        end_date = models.DateField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_vacation'
            unique_together = (('calendar', 'name'),)


    class ServerAnniversary(models.Model):
        calendar = models.ForeignKey('ServerCalendar')

        name = models.CharField(max_length=125)
        public_holiday = models.BooleanField()
        order = models.SmallIntegerField()

        fixed_date = models.CharField(max_length=6)

        day_occurrence = models.IntegerField(blank=True, null=True)
        weekday = models.IntegerField(blank=True, null=True)
        month = models.IntegerField(blank=True, null=True)

        easter_offset = models.IntegerField(blank=True, null=True)
        advent_offset = models.IntegerField(blank=True, null=True)

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_anniversary'
            unique_together = (('calendar', 'name'),)

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

    class ServerPart(models.Model):
        season = models.ForeignKey('ServerSeason')

        name = models.CharField(max_length=125)
        description = models.TextField()
        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_part'
            unique_together = (('season', 'name'),)


    class ServerSection(models.Model):
        season = models.ForeignKey(ServerSeason)
        part = models.ForeignKey(ServerPart)

        name = models.CharField(max_length=125)
        description = models.TextField()
        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_section'
            unique_together = (('season', 'part', 'name'),)


    class ServerChapter(models.Model):
        section = models.ForeignKey('ServerSection')
        season = models.ForeignKey('ServerSeason')

        name = models.CharField(max_length=125)
        description = models.TextField()
        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_chapter'
            unique_together = (('season', 'section', 'name'),)

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

    class ServerEvent(models.Model):
        season = models.ForeignKey('ServerSeason')
        instruction = models.ForeignKey('ServerInstruction', blank=True, null=True)

        title = models.CharField(max_length=30)
        name = models.CharField(max_length=125)
        description = models.TextField()

        cover = models.CharField(max_length=100)
        internal = models.BooleanField()

        location = models.CharField(max_length=75)
        start_date = models.DateField()
        start_time = models.TimeField(blank=True, null=True)
        approximate = models.ForeignKey(ServerApproximate, blank=True, null=True)
        end_date = models.DateField(blank=True, null=True)
        end_time = models.TimeField(blank=True, null=True)

        link = models.CharField(max_length=200)
        map = models.CharField(max_length=100)

        distal = models.BooleanField()
        rendezvous = models.CharField(max_length=75)
        source = models.CharField(max_length=75)

        public_transport = models.BooleanField()
        distance = models.IntegerField()
        lea = models.BooleanField()

        reference = models.ForeignKey('ServerReference')

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_event'

Vortrag
~~~~~~~

* Die Teilnehmerzahl kann begrenzt sein. => Buchungscode
* Es können Teilnehmerlisten geführt werden oder Eintrittskarten verkauft werden. => Buchungscode
* Die Veranstaltung kann auch für Nichtmitglieder offen stehen. => verschiedene Tarife

.. code-block:: python

    class ServerTalk(models.Model):
        season = models.ForeignKey(ServerSeason)
        talk = models.ForeignKey(ServerEvent, primary_key=True)

        speaker = models.CharField(max_length=125)
        admission = models.DecimalField(max_digits=6, decimal_places=2)

        state = models.ForeignKey(ServerState)

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_talk'


    class ServerTalkChapter(models.Model):
        talk = models.ForeignKey(ServerTalk)
        chapter = models.ForeignKey(ServerChapter)

        class Meta:
            db_table = 'server_talk_chapter'
            unique_together = (('talk', 'chapter'),)


    class ServerTalkTariffs(models.Model):
        talk = models.ForeignKey(ServerTalk)
        tariff = models.ForeignKey('ServerTariff')

        class Meta:
            db_table = 'server_talk_tariffs'
            unique_together = (('talk', 'tariff'),)

Gruppentermin
~~~~~~~~~~~~~

* Es können nur Gruppenmitglieder teilnehmen. => Kein Teilnehmerbeitrag
* Es gibt einen Ansprechpartner. => ``guide``
* Es kann Unterstützer im Team geben. => ``team``
* Jeder Gruppentermin gehört zu einer Gruppe. (``Collective``)

.. code-block:: python

    class ServerSession(models.Model):
        collective = models.ForeignKey(ServerCollective)
        session = models.ForeignKey(ServerEvent, primary_key=True)

        guide = models.ForeignKey(ServerGuide)

        fitness = models.ForeignKey(ServerFitness)
        skill = models.ForeignKey('ServerSkill')

        misc_equipment = models.CharField(max_length=75)
        speaker = models.CharField(max_length=125)
        portal = models.CharField(max_length=200)

        state = models.ForeignKey('ServerState')

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_session'


    class ServerSessionChapter(models.Model):
        session = models.ForeignKey(ServerSession)
        chapter = models.ForeignKey(ServerChapter)

        class Meta:
            db_table = 'server_session_chapter'
            unique_together = (('session', 'chapter'),)


    class ServerSessionEquipments(models.Model):
        session = models.ForeignKey(ServerSession)
        equipment = models.ForeignKey(ServerEquipment)

        class Meta:
            db_table = 'server_session_equipments'
            unique_together = (('session', 'equipment'),)


    class ServerSessionTeam(models.Model):
        session = models.ForeignKey(ServerSession)
        guide = models.ForeignKey(ServerGuide)

        class Meta:
            db_table = 'server_session_team'
            unique_together = (('session', 'guide'),)

Kurs
~~~~

* Die Teilnehmerzahl ist begrenzt. Es werden Teilnehmerlisten geführt. => Buchungscode
* Indoorkurse stehen auch Nichtmitgliedern offen. => verschiedene Tarife
* Es gibt einen Ansprechpartner. => ``guide``
* Es kann Unterstützer im Team geben. => ``team``
* Kurse können von Frauen exclusiv für Frauen veranstaltet werden. => ``ladies_only``

.. code-block:: python

    class ServerInstruction(models.Model):
        topic = models.ForeignKey('ServerTopic')
        instruction = models.ForeignKey(ServerEvent, primary_key=True)

        guide = models.ForeignKey(ServerGuide)
        ladies_only = models.BooleanField()

        admission = models.DecimalField(max_digits=6, decimal_places=2)
        advances = models.DecimalField(max_digits=6, decimal_places=2)
        advances_info = models.CharField(max_length=75)
        extra_charges = models.CharField(max_length=75)

        min_quantity = models.IntegerField()
        max_quantity = models.IntegerField()
        cur_quantity = models.IntegerField()

        calc_budget = models.DecimalField(max_digits=6, decimal_places=2)
        real_costs = models.DecimalField(max_digits=6, decimal_places=2)
        budget_info = postgres.JSONField(blank=True, null=True)

        message = models.TextField()
        comment = models.TextField()

        state = models.ForeignKey('ServerState')

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_instruction'


    class ServerInstructionChapter(models.Model):
        instruction = models.ForeignKey(ServerInstruction)
        chapter = models.ForeignKey(ServerChapter)

        class Meta:
            db_table = 'server_instruction_chapter'
            unique_together = (('instruction', 'chapter'),)


    class ServerInstructionTeam(models.Model):
        instruction = models.ForeignKey(ServerInstruction)
        guide = models.ForeignKey(ServerGuide)

        class Meta:
            db_table = 'server_instruction_team'
            unique_together = (('instruction', 'guide'),)

Gemeinschaftstour
~~~~~~~~~~~~~~~~~

* Die Teilnehmerzahl ist begrenzt. Es werden Teilnehmerlisten geführt. => Buchungscode
* Touren stehen nur Mitgliedern offen. => Eine Teilnehmergebühr ``admission``
* Es gibt einen Ansprechpartner. => ``guide``
* Es kann Unterstützer im Team geben. => ``team``
* Die Beherrschung bestimmter Kursinhalte kann notwendige Vorraussetzung für eine Teilnahme sein. => ``qualification_list``
* Touren können von Frauen exclusiv für Frauen veranstaltet werden. => ``ladies_only``

.. code-block:: python

    class ServerTour(models.Model):
        season = models.ForeignKey(ServerSeason)
        deadline = models.ForeignKey(ServerEvent, unique=True)
        preliminary = models.ForeignKey(ServerEvent, unique=True, blank=True, null=True)
        info = models.CharField(max_length=75)
        tour = models.ForeignKey(ServerEvent, primary_key=True)

        guide = models.ForeignKey(ServerGuide)
        preconditions = models.TextField()
        ladies_only = models.BooleanField()

        skill = models.ForeignKey(ServerSkill)
        fitness = models.ForeignKey(ServerFitness)

        misc_equipment = models.CharField(max_length=75)

        admission = models.DecimalField(max_digits=6, decimal_places=2)
        advances = models.DecimalField(max_digits=6, decimal_places=2)
        advances_info = models.CharField(max_length=75)
        extra_charges = models.CharField(max_length=75)

        min_quantity = models.IntegerField()
        max_quantity = models.IntegerField()
        cur_quantity = models.IntegerField()

        misc_category = models.CharField(max_length=75)
        portal = models.CharField(max_length=200)

        calc_budget = models.DecimalField(max_digits=6, decimal_places=2)
        real_costs = models.DecimalField(max_digits=6, decimal_places=2)
        budget_info = postgres.JSONField(blank=True, null=True)

        message = models.TextField()
        comment = models.TextField()

        state = models.ForeignKey(ServerState)

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_tour'


    class ServerTourCategories(models.Model):
        tour = models.ForeignKey(ServerTour)
        category = models.ForeignKey(ServerCategory)

        class Meta:
            db_table = 'server_tour_categories'
            unique_together = (('tour', 'category'),)


    class ServerTourChapter(models.Model):
        tour = models.ForeignKey(ServerTour)
        chapter = models.ForeignKey(ServerChapter)

        class Meta:
            db_table = 'server_tour_chapter'
            unique_together = (('tour', 'chapter'),)


    class ServerTourEquipments(models.Model):
        tour = models.ForeignKey(ServerTour)
        equipment = models.ForeignKey(ServerEquipment)

        class Meta:
            db_table = 'server_tour_equipments'
            unique_together = (('tour', 'equipment'),)


    class ServerTourQualifications(models.Model):
        tour = models.ForeignKey(ServerTour)
        topic = models.ForeignKey(ServerTopic, models.DO_NOTHIN)

        class Meta:
            db_table = 'server_tour_qualifications'
            unique_together = (('tour', 'topic'),)


    class ServerTourTeam(models.Model):
        tour = models.ForeignKey(ServerTour)
        guide = models.ForeignKey(ServerGuide)

        class Meta:
            db_table = 'server_tour_team'
            unique_together = (('tour', 'guide'),)

Kennung, Kategorie, Buchungscode
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Jedem Veranstaltungstermin ist eine eindeutige Kennung (``Reference``) zugeordnet.
Für Touren (``Tour``), Kurse (``Instruction``) und Vorträge (``Talk``) wird diese Kennung als Buchungscode benutzt.
Über die Kennung ist ebenfalls jedem Veranstaltungstermin eine Kategorie (``Category``) zugeordnet.
Aus dieser Angabe leitet sich z.B. ab in welcher Jahreszeit (Winter oder Sommer) eine Veranstaltung stattfinden soll.
Im Winter werden nur Wintersportarten (z.B. Skitouren oder Schneeschuhtouren) angeboten.
Im Sommer werden eben nur Sommersportarten (z.B. Bergtouren oder Touren mit dem Moutainbike) angeboten.

.. code-block:: python

    class ServerCategory(models.Model):
        season = models.ForeignKey('ServerSeason')

        code = models.CharField(max_length=3)
        name = models.CharField(max_length=125)
        order = models.SmallIntegerField()

        tour = models.BooleanField()
        talk = models.BooleanField()
        topic = models.BooleanField()
        collective = models.BooleanField()

        winter = models.BooleanField()
        summer = models.BooleanField()
        climbing = models.BooleanField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_category'
            unique_together = (('season', 'code'), ('season', 'code', 'name'),)


    class ServerReference(models.Model):
        season = models.ForeignKey('ServerSeason')
        category = models.ForeignKey(ServerCategory)

        reference = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_reference'
            unique_together = (('season', 'reference', 'category'),)

Gruppe
~~~~~~

.. code-block:: python

    class ServerCollective(models.Model):
        season = models.ForeignKey('ServerSeason')
        section = models.ForeignKey('ServerSection')

        title = models.CharField(max_length=30)
        name = models.CharField(max_length=125)
        description = models.TextField()

        cover = models.CharField(max_length=100)
        internal = models.BooleanField()
        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_collective'
            unique_together = (('season', 'title', 'name'),)


    class ServerCollectiveCategories(models.Model):
        collective = models.ForeignKey(ServerCollective)
        category = models.ForeignKey(ServerCategory)

        class Meta:
            db_table = 'server_collective_categories'
            unique_together = (('collective', 'category'),)


    class ServerCollectiveManagers(models.Model):
        collective = models.ForeignKey(ServerCollective)
        guide = models.ForeignKey('ServerGuide')

        class Meta:
            db_table = 'server_collective_managers'
            unique_together = (('collective', 'guide'),)

Abfahrtzeiten
~~~~~~~~~~~~~

.. code-block:: python

    class ServerApproximate(models.Model):
        season = models.ForeignKey('ServerSeason')

        name = models.CharField(max_length=30)
        description = models.TextField()
        start_time = models.TimeField()
        default = models.BooleanField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_approximate'
            unique_together = (('season', 'name'),)

Ausrüstung
~~~~~~~~~~

.. code-block:: python

    class ServerEquipment(models.Model):
        season = models.ForeignKey('ServerSeason')

        code = models.CharField(max_length=10)
        name = models.CharField(max_length=125)
        description = models.TextField()
        default = models.BooleanField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_equipment'
            unique_together = (('season', 'name'), ('season', 'code'),)

Konditionelle Anforderungen
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    class ServerFitness(models.Model):
        season = models.ForeignKey('ServerSeason')

        code = models.CharField(max_length=3)
        default = models.BooleanField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_fitness'
            unique_together = (('season', 'code'),)


    class ServerFitnessdescription(models.Model):
        season = models.ForeignKey('ServerSeason')

        fitness = models.ForeignKey(ServerFitness)
        category = models.ForeignKey(ServerCategory)

        description = models.TextField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_fitnessdescription'
            unique_together = (('season', 'fitness', 'category'),)

Technische Anforderungen
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    class ServerSkill(models.Model):
        season = models.ForeignKey(ServerSeason)

        code = models.CharField(max_length=3)
        default = models.BooleanField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_skill'
            unique_together = (('season', 'code'),)


    class ServerSkilldescription(models.Model):
        season = models.ForeignKey(ServerSeason)

        skill = models.ForeignKey(ServerSkill)
        category = models.ForeignKey(ServerCategory)

        description = models.TextField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_skilldescription'
            unique_together = (('season', 'skill', 'category'),)

Kursinhalt
~~~~~~~~~~

.. code-block:: python

    class ServerTopic(models.Model):
        season = models.ForeignKey(ServerSeason)
        category = models.ForeignKey(ServerCategory)

        title = models.CharField(max_length=30)
        name = models.CharField(max_length=125)
        description = models.TextField()
        cover = models.CharField(max_length=100)

        internal = models.BooleanField()

        misc_equipment = models.CharField(max_length=75)
        preconditions = models.TextField()

        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_topic'


    class ServerTopicEquipments(models.Model):
        topic = models.ForeignKey(ServerTopic)
        equipment = models.ForeignKey(ServerEquipment)

        class Meta:
            db_table = 'server_topic_equipments'
            unique_together = (('topic', 'equipment'),)


    class ServerTopicQualifications(models.Model):
        from_topic = models.ForeignKey(ServerTopic)
        to_topic = models.ForeignKey(ServerTopic)

        class Meta:
            db_table = 'server_topic_qualifications'
            unique_together = (('from_topic', 'to_topic'),)


    class ServerTopicTariffs(models.Model):
        topic = models.ForeignKey(ServerTopic)
        tariff = models.ForeignKey(ServerTariff)

        class Meta:
            db_table = 'server_topic_tariffs'
            unique_together = (('topic', 'tariff'),)

Preisgruppen
~~~~~~~~~~~~

.. code-block:: python

    class ServerTariff(models.Model):
        season = models.ForeignKey(ServerSeason)

        name = models.CharField(max_length=125)
        description = models.TextField()

        multiplier = models.DecimalField(max_digits=6, decimal_places=3)

        order = models.SmallIntegerField()

        updated = models.DateTimeField()
        deprecated = models.BooleanField()

        class Meta:
            db_table = 'server_tariff'
            unique_together = (('season', 'name'),)

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
