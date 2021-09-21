.. _server:

Server - Modul
==============

Das Server-Module beinhaltet alle Abschnitte des Backends. Die Abschnitte reichen von Admin-Panel bis zu der REST-API,
die die Datenbankeinträge zur Verfügung stellt, und den zugehörigen :ref:`Datenbankmodellen<architecture>`.

Admin - Panel
~~~~~~~~~~~~~
Das Admin-Panel ist ein in Django integrierter Backendendzugang, für den man die Authentifizierungsdaten eines Staff-Mitglieds
oder Administrators braucht. Im Admin-Panel kann man alle Arten von neuen Datenbankeinträgen einpflegen, die man vorher
sichtbar gemacht hat. Für die Sichtbarkeit müssen die Modelle registriert werden (``admin.site.register``). Standartmäßig
sind die Modelle ``user`` und ``group`` registriert.

.. code-block:: python


    # Auth.User
    admin.site.unregister(User)
    admin.site.register(User, UserAdmin)

    # Calendar
    admin.site.register(Calendar)
    admin.site.register(Anniversary)
    admin.site.register(Vacation)

    # Collective
    admin.site.register(Collective)
    admin.site.register(Session)

    # Qualifications
    admin.site.register(Qualification)
    admin.site.register(QualificationGroup)

    # Mixins
    admin.site.register(Category)
    admin.site.register(CategoryGroup)
    admin.site.register(Tour, TourAdmin)
    admin.site.register(Equipment)

    # Instructions
    admin.site.register(Instruction, InstructionAdmin)
    admin.site.register(Topic)

Die registrierten Modelle sind mittels eigener Klassen modifizierbar. In diesen Klassen sind die dargestellten Felder und
deren Gruppierung definiert. Zudem lässt sich einstellen, welche Felder ``read-only`` gesetzt werden. Dazu erweitert man
die gewünschte Basisklasse.

.. code-block:: python


    class UserAdmin(BaseUserAdmin):

        fieldsets = (
            ('Login', {
                'classes': ['collapse'],
                'fields': ('username', 'password',)
            }),
            ('Admin', {
                'classes': ['collapse'],
                'fields': ('is_active', 'is_staff', 'is_superuser', 'user_permissions', 'date_joined', 'last_login',)
            }),
            (None, {
                'fields': ('first_name', 'last_name', 'email', 'groups',)
            }),
        )
        readonly_fields = ['password']

In der neuen Klasse definiert man auch gewünschte Felder aus anderen Datenmodellen, die Sortierung der Einträge, die
jeweiligen Aktionen des Datenmodells und die Filter. Hier im Beispiel werden die Felder vom Trainerprofil ``GuideInline``,
den Nutzerprofil ``ProfileInline`` und den jeweiligen Ausbildungen ``QualificationInline`` und Fortbildugen ``RetrainingInline``
verknüpft. Die Sortierung folgt erst nach Nachname(``last_name``) und dann nach Vornamen (``first_name``). Die Filter
sind in ``list_filter`` definiert. Hier kann man die build-in Filter oder selbst definierte Filter einbinden.

.. code-block:: python


        inlines = (GuideInline, ProfileInline, QualificationInline, RetrainingInline,)
        ordering = ('last_name', 'first_name')

        actions = ['export_as_csv', ]

        list_filter = ('is_staff', 'is_active', 'groups', QualificationFilter)

Die eingebunden Aktionen müssen definiert und benannt werden. Für die Benennung hat jede Aktion eine Kurzbeschreibung
(``short_description``). Rückgabewert einer Funktion ist meistens eine HTML-``response``, wenn es gewünscht ist eine
Datei zu kreieren oder sich spezifische Daten anzeigen zu lassen.


.. code-block:: python


        def export_as_csv(self, request, queryset):
            meta = self.model._meta

            # Field-Names and their better looking brothers
            field_names = ['first_name', 'last_name', 'email']
            field_names_clear = ['Vorname', 'Nachname', 'E-Mail']

            # Additional Fields, which are connected to User-Model
            field_names_additional = ['Geburtstag', 'Gruppen', 'Ausbildungen']

            response = HttpResponse(content_type='text/csv; charset=latin-1')
            response['Content-Disposition'] = 'attachment; filename=django_user.csv'
            writer = csv.writer(response, delimiter=';')

            writer.writerow(field_names_clear + field_names_additional)
            for obj in queryset:
                row_list = [getattr(obj, field) for field in field_names]

                # Prepare Birthdate for each User
                try:
                    profile = Profile.objects.get(user=obj)
                    date_list = str(profile.birth_date).split('-')
                    birthdate = date_list[2] + '.' + date_list[1] + '.' + date_list[0]
                except:
                    birthdate = ''
                row_list.append(birthdate)

                # Prepare Groups for each User
                group_str = ''
                for group in Group.objects.filter(user=obj):
                    group_str += group.name + ', '
                group_str = group_str[:-2]
                row_list.append(group_str)

                # Prepare UserQualification for each User
                qualification_str = ''
                for qualification in UserQualification.objects.filter(user=obj):
                    qualification_str += qualification.qualification.code + ', '
                qualification_str = qualification_str[:-2]
                row_list.append(qualification_str)

                row = writer.writerow(row_list)

            return response

        export_as_csv.short_description = 'Excel-Export'

Zusätzlich ist es möglich sich verschiedene Datenfelder in der Listenansicht eines Modells anzeigen zu lassen. Unter
``list_display`` sind die Felder für die Anzeige definiert. Die Felder kann man vor der Darstellung zusätlich modifizieren,
so das Format des Datenfelds ausgegeben wird. Zudem kann die Spalte des neudefinierten Datenfelds mit ``short_description``
neu benannt werden.

.. code-block:: python


        list_display = ('username', 'first_name', 'last_name', 'email', 'get_userQualification')

        def get_userQualification(self, obj):
            qual_string = ''
            for qual in UserQualification.objects.filter(user=obj):
                qual_string = qual_string + qual.qualification.code + '(' + str(qual.year) + '), '
            qual_string = qual_string[:-2]
            return qual_string

        get_userQualification.short_description = 'Ausbildungen'

Mit Inlines lassen sich verschiedene Felder aus Datenbankmodellen importieren und an einem Ort zusammenfassen. Für ein
Inline ist es nötig das Modell anzugeben und die Felder zu definieren. Zusätzlich lassen sich auch noch andere Felder
für die Darstellung konfigurieren.

.. code-block:: python


    class GuideInline(admin.StackedInline):
        model = Guide
        fields = ('unknown', 'profile', 'phone', 'mobile', 'email', 'portrait')
        extra = 0
        verbose_name = 'Trainer-Profil'
        verbose_name_plural = 'Trainer-Profil'
        classes = ['collapse']

Filter filtern Objektlisten nach verschiedenen Spezifika. Dies passiert auf Grundlage verschiedener Felder des zu filternden
Datenmodells. Die nachfolgende Funktion soll die Nutzer nach deren Ausbildung filterbar machen. Zusätzlich können die Namen
der Ausbildungen für die bessere Darstellung angepasst werden.

.. code-block:: python


    class QualificationFilter(SimpleListFilter):
        title = _('Trainer-Qualifikationen')
        parameter_name = 'UserQualification'

        tuple_list = []
        for query in Qualification.objects.all():
            short_queryname = query.name\
                .replace("Trainer ", "T")\
                .replace("Fachübungsleiter", "FÜL")\
                .replace("Zusatzqualifikation", "ZQ")
            tuple_list.append((query.code, _(short_queryname)))

        def lookups(self, request, model_admin):
            return self.tuple_list

        def queryset(self, request, queryset):
            if self.value():
                return queryset.filter(qualification_list__qualification__code=self.value())

REST - API
~~~~~~~~~~
Django nutzt ein Model-View-Template-Pattern (vgl. `MVC <https://de.wikipedia.org/wiki/Model_View_Controller>`_). Das
MVC-Pattern trennt die Darstellung von Daten von deren Modell und der Umsetzung von Nutzerinteraktionen. Die Verwaltung
der Requests übernimmt der ``View``.

.. code-block:: python


    class IsOwnerOrReadOnly(permissions.BasePermission):
        """
        Object-level permission to only allow owners of an object to edit it.
        """
        def has_permission(self, request, view):
            # Allow POST-request from authenticated users
            if request.user.is_authenticated and request.user.is_staff:
                return True

            return request.method in permissions.SAFE_METHODS

        def has_object_permission(self, request, view, obj):
            if request.method is not None and request.method in permissions.SAFE_METHODS and request.user.is_staff:
                return True
            # User is only allowed to perform actions on own objects,
            # expect DELETE-Requests.
            if obj.guide is not None and obj.guide.user == request.user
                return True
            return False

Im ``View`` ist unter anderem das Permission-Handling definiert. Das heißt z.B. das bestimmte Requests abgeblockt werden,
die von nicht authentifizierten Quellen kommen. Das Permission kann man je nach Anforderungen an die REST-API entsprechend
anpassen.

Kommt ein HTTP-Request durch verarbeitet das ``Viewset`` diesen Request und kommuniziert mit dem zugehörigen Serializer.
Welche Funktion des ``Viewset`` aktiviert wird, hängt von der Art des HTTP-Requests ab.

.. code-block:: python


    class InstructionViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):

        permission_classes = (IsOwnerOrReadOnly, )

        queryset = (
            Instruction.objects
            .filter(deprecated=False, instruction__season__current=True)
        )

        def get_serializer_class(self):
            if self.action == 'list':
                return InstructionListSerializer
            return InstructionSerializer

Bei einem GET-Request ist der Rückgabewert je nach Schnittstelle eine Liste von Veranstaltungszusammenfassungen oder die
Informationen zur Veranstaltung an sich (``list``, ``retrieve``). Die abgerufenen Daten sind im ``json``-Format.

.. code-block:: python


        def list(self, request, *args, **kwargs):
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True, context=dict(request=request))

            response = Response(serializer.data)
            response['Cache-Control'] = "public, max-age=86400"
            if queryset.exists():
                latest = queryset.latest()
            return response

        def retrieve(self, request, pk=None, *args, **kwargs):

            try:
                pk = int(pk)
            except ValueError:
                raise Http404

            queryset = self.get_queryset()
            instance = self.get_object()
            self.check_object_permissions(self.request, obj=instance)

            serializer = self.get_serializer(instance)
            response = Response(serializer.data)
            response['Cache-Control'] = "public, max-age=86400"
            if queryset.exists():
                response['ETag'] = '"{}"'.format(instance.get_etag())
                response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
            return response

Bei einem PUT-Request werden die übermittelten Daten an den entsprechenden Serializer weitergegeben, der diese Daten dann
verarbeitet. Bevor das passiert muss noch eine Validierung der Daten stattfinden. Ist diese erfolgreich werden die Daten
gespeichert.

.. code-block:: python


        def update(self, request, pk=None, *args, **kwargs):

            try:
                pk = int(pk)
            except ValueError:
                raise Http404

            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            if getattr(instance, '_prefetched_objects_cache', None):
                # If 'prefetch_related' has been applied to a queryset, we need to
                # forcibly invalidate the prefetch cache on the instance.
                instance._prefetched_objects_cache = {}

            return Response(serializer.data)

Bei einem DELETE-Request wird das korrespondierende Objekt aus der Datenbank abgerufen und das Feld ``deprecated`` auf
``True`` gesetzt. Die Veranstaltung wird nicht wirklich gelöscht sondern nur in den Status "Gelöscht". Rückgabewert ist
dann das bei der API-URL keine Daten mehr vorhanden sind (``HTTP_204_NO_CONTENT``).

.. code-block:: python


        def destroy(self, request, pk=None, *args, **kwargs):

            try:
                pk = int(pk)
            except ValueError:
                raise Http404

            instance = self.get_object()

            instruction = instance.instruction
            if instruction:
                reference = instruction.reference
                if reference:
                    reference.deprecated = True
                    reference.save()

                instruction.deprecated = True
                instruction.save()

            meetings = instance.meeting_list.all()
            for meeting in meetings:
                reference = meeting.reference
                if reference:
                    reference.deprecated = True
                    reference.save()
                meeting.deprecated = True
                meeting.save()

            instance.deprecated = True
            instance.save()

            return Response(status=status.HTTP_204_NO_CONTENT)

Der Serializer nimmt die Daten vom View entgegen und verarbeitet diese in Verbindung mit den entsprechenden Datenfeldern.
Dafür müssen die Datenfelder im Serializer definiert und mit dem entsprechenden Datenmodell verknüpft werden.

.. code-block:: python


    class InstructionSerializer(serializers.ModelSerializer):

        id = serializers.PrimaryKeyRelatedField(source='pk', queryset=Instruction.objects.all(), default=None, allow_null=True)
        reference = serializers.CharField(source='instruction.reference.__str__', read_only=True)

        guideId = serializers.PrimaryKeyRelatedField(
            source='guide', default=None, allow_null=True, queryset=Guide.objects.all()
        )
        teamIds = serializers.PrimaryKeyRelatedField(
            source='team', many=True, default=[], queryset=Guide.objects.all()
        )

        topicId = serializers.PrimaryKeyRelatedField(source='topic', queryset=Topic.objects.all())
        instruction = EventSerializer(default={})
        meetings = EventSerializer(source='meeting_list', many=True, default=[])
        ladiesOnly = serializers.BooleanField(source='ladies_only', default=False)
        isSpecial = serializers.BooleanField(source='is_special', default=False)
        categoryId = serializers.PrimaryKeyRelatedField(
            source='category', default=None, allow_null=True, queryset=Category.objects.all()
        )

        qualificationIds = serializers.PrimaryKeyRelatedField(
            source='qualifications', many=True, default=[], queryset=Topic.objects.all()
        )
        preconditions = serializers.CharField(default='', allow_blank=True)

        equipmentIds = serializers.PrimaryKeyRelatedField(
            source='equipments', many=True, default=[], queryset=Equipment.objects.all()
        )
        miscEquipment = serializers.CharField(source='misc_equipment', max_length=75, default='', allow_blank=True)
        equipmentService = serializers.BooleanField(source='equipment_service', default=False)

        admission = MoneyField()
        advances = MoneyField()
        advancesInfo = serializers.CharField(source='advances_info', default='', allow_blank=True)
        extraCharges = MoneyField(source='extra_charges')
        extraChargesInfo = serializers.CharField(source='extra_charges_info', max_length=75, default='', allow_blank=True)
        minQuantity = serializers.IntegerField(source='min_quantity', default=0)
        maxQuantity = serializers.IntegerField(source='max_quantity', default=0)
        curQuantity = serializers.IntegerField(source='cur_quantity', default=0)

        stateId = serializers.PrimaryKeyRelatedField(source='state', required=False, queryset=State.objects.all())
        deprecated = serializers.BooleanField(default=False, required=False)

        message = serializers.CharField(default='', required=False, allow_null=True, allow_blank=True)
        comment = serializers.CharField(default='', required=False, allow_null=True, allow_blank=True)

        class Meta:
            model = Instruction
            fields = (
                'id', 'reference',
                'guideId', 'teamIds',
                'topicId',
                'instruction', 'meetings',
                'ladiesOnly',
                'isSpecial', 'categoryId',
                'qualificationIds', 'preconditions',
                'equipmentIds', 'miscEquipment', 'equipmentService',
                'admission', 'advances', 'advancesInfo', 'extraCharges', 'extraChargesInfo',
                'minQuantity', 'maxQuantity', 'curQuantity',
                'deprecated', 'stateId',
                'message', 'comment'
            )


Für die Zuordnung der Daten ist es nötig diese im ersten Schritt zu parsen und zu validieren. Hier wird geprüft ob die
erforderlichen Felder in den entgegegenommenen Daten sind oder essentielle Datenfelder fehlen.

.. code-block:: python

        def validate(self, data):
            if self.instance is not None:

                instruction = self.instance

                instance_data = data.get('pk')
                if instance_data is None:
                    raise serializers.ValidationError("instance Id is missing")
                elif instance_data.pk != instruction.pk:
                    raise serializers.ValidationError("Wrong instance Id")

                instruction_data = data.get('instruction')
                if instruction_data is not None:
                    instruction_instance = instruction_data.get('pk')
                    if instruction_instance is None:
                        raise serializers.ValidationError("instruction Id is missing")
                    elif instruction_instance.pk != instruction.instruction_id:
                        raise serializers.ValidationError("Wrong meeting Id")

                meeting_list = data.get('meeting_list')
                if meeting_list is not None:
                    meeting_ids = set(instruction.meeting_list.values_list('pk', flat=True))
                    for meeting_data in meeting_list:
                        meeting_instance = meeting_data.get('pk')
                        if meeting_instance is None:
                            # meeting will be new created
                            continue
                        elif meeting_instance.pk not in meeting_ids:
                            raise serializers.ValidationError(
                                f"meeting Id {meeting_instance.pk} is not member of instruction with id {instruction.pk}"
                            )
                        meeting_ids.remove(meeting_instance.pk)
                    if len(meeting_ids) > 0:
                        raise serializers.ValidationError(
                            "meeting_list is not complete"
                        )

            return data

Nach der Validierung wird je nach HTTP-Request eine Veranstaltung erstellt oder verändert. Im Fall einer Erstellung
(POST-Request) einer Veranstaltung wird eine Veranstaltung auf Grundlage der geparsten Daten erzeugt und dem ``View``
zürckgegeben. Im ``View`` wird die Veranstaltung dann gespeichtert (``instance.save``).

.. code-block:: python


        def create(self, validated_data):
            instance = validated_data.pop('pk')
            if instance:
                return self.update(instance, validated_data)
            else:
                event_data = validated_data.pop('instruction')
                event_data.update({'new': True})
                meeting_list = validated_data.pop('meeting_list')
                team = validated_data.pop('team')
                qualifications = validated_data.pop('qualifications')
                equipments = validated_data.pop('equipments')
                state = validated_data.pop('state', get_default_state())
                topic = validated_data.get('topic')
                category = topic.category
                season = get_default_season()
                event = create_event(event_data, dict(category=category, season=season, type=dict(topic=True)))
                instruction = Instruction.objects.create(instruction=event, state=state, **validated_data)
                for meeting_data in meeting_list:
                    meeting = create_event(meeting_data, dict(season=season, type=dict(meeting=True)))
                    meeting.instruction = instruction
                    meeting.save()
                instruction.team.set(team)
                instruction.qualifications.set(qualifications)
                instruction.equipments.set(equipments)
                return instruction

Im Fall eines PUT-Requests holt der Serializer die Veranstaltung aus der Datenbank und überschreibt die ensprechenden Felder.
Das Verfahren lässt sich auch noch zusätzlich modifizieren und dem System anpassen.

.. code-block:: python


        def update(self, instance, validated_data):
            instance.guide = validated_data.get('guide', instance.guide)
            team = validated_data.get('team')
            if team is not None:
                instance.team.set(team)
            instruction_data = validated_data.get('instruction')
            if instruction_data is not None:
                instruction = Event.objects.get(pk=instruction_data.get('pk'))
                update_event(instruction, instruction_data, self.context)
            meeting_list = validated_data.get('meeting_list')
            if meeting_list is not None:
                season = instance.topic.seasons.get(current=True)
                for meeting_data in meeting_list:
                    new_meeting = meeting_data.get('pk') is None
                    meeting = create_event(meeting_data, dict(season=season, type=dict(meeting=True)))
                    if new_meeting:
                        meeting.instruction = instance
                        meeting.save()
            instance.ladies_only = validated_data.get('ladies_only', instance.ladies_only)
            instance.is_special = validated_data.get('is_special', instance.is_special)
            instance.category = validated_data.get('category', instance.category)
            qualifications = validated_data.get('qualifications')
            if qualifications is not None:
                instance.qualifications.set(qualifications)
            instance.preconditions = validated_data.get('preconditions', instance.preconditions)
            equipments = validated_data.get('equipments')
            if equipments is not None:
                instance.equipments.set(equipments)
            instance.misc_equipment = validated_data.get('misc_equipment', instance.misc_equipment)
            instance.equipment_service = validated_data.get('equipment_service', instance.equipment_service)
            instance.admission = validated_data.get('admission', instance.admission)
            instance.advances = validated_data.get('advances', instance.advances)
            instance.advances_info = validated_data.get('advances_info', instance.advances_info)
            instance.extra_charges = validated_data.get('extra_charges', instance.extra_charges)
            instance.extra_charges_info = validated_data.get('extra_charges_info', instance.extra_charges_info)
            instance.min_quantity = validated_data.get('min_quantity', instance.min_quantity)
            instance.max_quantity = validated_data.get('max_quantity', instance.max_quantity)
            instance.cur_quantity = validated_data.get('cur_quantity', instance.cur_quantity)
            instance.deprecated = validated_data.get('deprecated', instance.deprecated)
            instance.state = validated_data.get('state', instance.state)
            instance.comment = validated_data.get('comment', instance.comment)
            instance.message = validated_data.get('message', instance.message)
            instance.save()
            return instance
