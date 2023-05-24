# -*- coding: utf-8 -*-
from django.db import models
from django.template.defaultfilters import date, time

from .reference import Reference
from .equipment import Equipment
from .approximate import Approximate
from .mixins import SeasonMixin, DescriptionMixin
from .time_base import TimeMixin
from . import fields


class EventManager(models.Manager):

    def get_by_natural_key(self, season, reference):
        reference = Reference.get_reference(reference, season)
        return reference.event


class Event(SeasonMixin, TimeMixin, DescriptionMixin, models.Model):
    """
    The option (blank=True, default='') for CharField describes an optional element
    field == '' => data is not available
    field != '' => data is Valid

    The option (blank=True, null=True) for the other fields describes an optional element
    field is None => data is not available
    field is not None => data is Valid
    """

    objects = EventManager()

    # noinspection PyUnresolvedReferences
    reference = models.OneToOneField(
        'Reference',
        primary_key=True,
        verbose_name='Buchungscode',
        related_name='event',
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

    # check event.season == instruction.topic.season

    # noinspection PyUnresolvedReferences
    instruction = models.ForeignKey(
        'Instruction',
        db_index=True,
        blank=True, null=True,
        verbose_name='Kurs',
        related_name='meeting_list',
        on_delete=models.PROTECT,
    )

    def natural_key(self):
        return self.season.name, str(self.reference)

    natural_key.dependencies = ['server.season', 'server.reference']

    def __str__(self):
        if hasattr(self, 'meeting') and not self.meeting.is_special:
            title = self.meeting.topic.title
        else:
            title = self.title
        return "{} - {}, {} [{}]".format(self.reference, title, self.long_date(with_year=True), self.season.name)

    def long_date(self, with_year=False, with_time=False):
        """
        :param with_year: False

        5. September
        22. bis 25. Januar
        28. Mai bis 3. Juni
        30. Dezember 2016 bis 6. Januar 2017

        :param with_year: True

        5. September 2016
        22. bis 25. Januar 2016
        28. Mai bis 3. Juni 2016
        30. Dezember 2016 bis 6. Januar 2017

        :return: long formatted date
        """

        y = ' Y' if with_year else ''
        if self.end_date is None or self.start_date == self.end_date:
            value = date(self.start_date, "j. F" + y)
            if with_time and self.start_time:
                if self.end_time is None or self.start_time == self.end_time:
                    if self.start_time.minute:
                        if self.start_time.minute < 10:
                            minute = time(self.start_time, "i")[1:]
                        else:
                            minute = time(self.start_time, "i")
                        value = "{}, {}.{}".format(value, time(self.start_time, "G"), minute)
                    else:
                        value = "{}, {}".format(value, time(self.start_time, "G"))
                else:
                    if self.end_time.minute:
                        if self.start_time.minute < 10:
                            minute = time(self.start_time, "i")[1:]
                        else:
                            minute = time(self.start_time, "i")
                        value = "{}, {}.{}".format(value, time(self.start_time, "G"), minute)
                    else:
                        value = "{} bis {}".format(value, time(self.start_time, "G"))
                value = "{} Uhr".format(value)
            return value
        elif self.start_date.month == self.end_date.month and self.start_date.year == self.end_date.year:
            return "{0} bis {1}".format(date(self.start_date, "j."), date(self.end_date, "j. F" + y))
        elif self.start_date.month != self.end_date.month:
            y0 = ''
            if self.start_date.year != self.end_date.year:
                y0 = y = ' Y'
            return "{0} bis {1}".format(date(self.start_date, "j. F" + y0), date(self.end_date, "j. F" + y))

    def short_date(self, with_year=False):
        """
        :param with_year: False

        05.09.
        22.01 - 25.01.
        28.05. - 03.06.

        :param with_year: True

        05.09.2016
        22.01.2016 - 25.01.2016
        28.05.2016 - 03.06.2016

        :return: short formatted date
        """

        y = 'Y' if with_year else ''
        if self.end_date is None or self.start_date == self.end_date:
            return date(self.start_date, "d.m." + y)
        return "{0} - {1}".format(date(self.start_date, "d.m." + y), date(self.end_date, "d.m." + y))

    def departure(self):
        """
            {start_date}, {start_time}, {rendezvous}, Heimkehr am {end_date} gegen {end_time} Uhr
        """
        season_year = int(self.season.name)
        with_year = season_year != self.start_date.year or (self.end_date and season_year != self.end_date.year)
        y = 'Y' if with_year else ''
        start_date = date(self.start_date, "j.n." + y)

        if self.start_time:
            if self.start_time.minute:
                start_time = time(self.start_time, "G.i")
            else:
                start_time = time(self.start_time, "G")
            start_time = "{} Uhr".format(start_time)
        else:
            start_time = self.approximate.name if self.approximate else ''

        if self.end_date and self.end_date != self.start_date:
            end_date = date(self.end_date, "j.n." + y)
        else:
            end_date = ''

        if self.end_time:
            if self.end_time.minute:
                end_time = time(self.end_time, "G.i")
            else:
                end_time = time(self.end_time, "G")
        else:
            end_time = ''

        departure = "{}, {}".format(start_date, start_time)
        if self.rendezvous:
            departure = "{}, {}".format(departure, self.rendezvous)
        if end_time:
            departure = "{}, Heimkehr".format(departure)
            if end_date:
                departure = "{} am {}".format(departure, end_date)
            departure = "{} gegen {} Uhr".format(departure, end_time)
        return departure

    def appointment(self):
        """
            {start_date}, {start_time} Uhr, {name}, {location}, {rendezvous}
            {start_date}, {start_time} bis {end_time} Uhr, {name}, {location}, {rendezvous}
            {start_date}, {start_time} Uhr bis {end_date}, {end_time} Uhr, {name}, {location}, {rendezvous}
            {start_date}, {start_time} Uhr bis {end_date}, {name}, {location}, {rendezvous}
        """
        appointment = ''
        season_year = int(self.season.name)
        with_year = season_year != self.start_date.year or (self.end_date and season_year != self.end_date.year)
        y = 'Y' if with_year else ''
        start_date = date(self.start_date, "j.n." + y)
        end_date = date(self.end_date, "j.n." + y) if self.end_date else ''
        approximate = ''

        if self.start_time:
            if self.start_time.minute:
                start_time = time(self.start_time, "G.i")
            else:
                start_time = time(self.start_time, "G")
        elif self.approximate:
            start_time = ''
            approximate = self.approximate.name
        else:
            start_time = ''

        if self.end_time:
            if self.end_time.minute:
                end_time = time(self.end_time, "G.i")
            else:
                end_time = time(self.end_time, "G")
        else:
            end_time = ''

        if start_time:
            appointment = "{}, {}".format(start_date, start_time)
            if end_time:
                if end_date:
                    appointment = "{} Uhr bis {}, {} Uhr".format(appointment, end_date, end_time)
                else:
                    appointment = "{} bis {} Uhr".format(appointment, end_time)
            else:
                appointment = "{} Uhr".format(appointment)
        if approximate:
            appointment = "{}, {}".format(start_date, approximate)
        if self.name:
            appointment = "{}, {}".format(appointment, self.name)
        if self.location:
            appointment = "{}, {}".format(appointment, self.location)
        if self.rendezvous:
            appointment = "{}, {}".format(appointment, self.rendezvous)
        return appointment

    def prefixed_date(self, prefix, formatter, with_year=False):
        """
        Beispiel: "Anmeldung bis 10.03."

        :param prefix:
        :param formatter: a unbound methode like short_date or long_date
        :param with_year:
        :return:
        """
        return "{} {}".format(prefix, formatter(self, with_year))

    @property
    def activity(self):
        if hasattr(self, 'tour') and self.tour:
            return "tour"
        if hasattr(self, 'talk') and self.talk:
            return "talk"
        if hasattr(self, 'meeting') and self.meeting:
            return "topic"
        if hasattr(self, 'session') and self.session:
            return "collective"

    @property
    def division(self):
        winter = self.reference.category.winter
        summer = self.reference.category.summer
        indoor = self.reference.category.climbing

        if winter and not summer and not indoor:
            return "winter"
        elif not winter and summer and not indoor:
            return "summer"
        elif not winter and not summer and indoor:
            return "indoor"
        else:
            return "misc"

    @property
    def state(self):
        if hasattr(self, 'tour') and self.tour:
            state = self.tour.state
        elif hasattr(self, 'talk') and self.talk:
            state = self.talk.state
        elif hasattr(self, 'meeting') and self.meeting:
            state = self.meeting.state
        elif hasattr(self, 'session') and self.session:
            state = self.session.state
        else:
            return None

        if state:
            if state.done:
                return "done"
            if state.moved:
                return "moved"
            if state.canceled:
                return "canceled"
            if state.unfeasible:
                return "unfeasible"
            if state.public:
                return "public"
            else:
                return "private"

    @property
    def quantity(self):
        if hasattr(self, 'tour') and self.tour:
            min_quantity = self.tour.min_quantity
            max_quantity = self.tour.max_quantity
            cur_quantity = self.tour.cur_quantity
        elif hasattr(self, 'talk') and self.talk:
            min_quantity = self.talk.min_quantity
            max_quantity = self.talk.max_quantity
            cur_quantity = self.talk.cur_quantity
        elif hasattr(self, 'meeting') and self.meeting:
            min_quantity = self.meeting.min_quantity
            max_quantity = self.meeting.max_quantity
            cur_quantity = self.meeting.cur_quantity
        else:
            return None

        return {
            "min": min_quantity,
            "max": max_quantity,
            "current": cur_quantity
        }

    @property
    def admission(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.admission
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.admission
        if hasattr(self, 'talk') and self.talk:
            return self.talk.admission

    @property
    def extra_charges(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.extra_charges
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.extra_charges

    @property
    def extra_charges_info(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.extra_charges_info
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.extra_charges_info

    @property
    def advances(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.advances
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.advances

    @property
    def advances_info(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.advances_info
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.advances_info

    @property
    def speaker(self):
        if hasattr(self, 'talk') and self.talk:
            return self.talk.speaker
        if hasattr(self, 'session') and self.session:
            return self.session.speaker
        return None

    @property
    def guide(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.guide
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.guide
        if hasattr(self, 'session') and self.session:
            return self.session.guide

    @property
    def guides(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.guides()
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.guides()
        if hasattr(self, 'session') and self.session:
            return self.session.guides()

    @property
    def skill(self):
        skill = None
        if hasattr(self, 'tour') and self.tour:
            skill = self.tour.skill
        if hasattr(self, 'session') and self.session:
            skill = self.session.skill if skill.code != "x" else None
        return skill.order if skill else None

    @property
    def fitness(self):
        fitness = None
        if hasattr(self, 'tour') and self.tour:
            fitness = self.tour.fitness
        if hasattr(self, 'session') and self.session:
            fitness = self.session.fitness if fitness.code != "x" else None
        return fitness.order if fitness else None

    @property
    def ladies_only(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.ladies_only
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.ladies_only
        if hasattr(self, 'session') and self.session:
            return self.session.ladies_only
        return False

    @property
    def youth_on_tour(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.youth_on_tour
        return False

    @property
    def relaxed(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.relaxed
        return False

    @property
    def mountain_bus(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.mountain_bus
        return False

    @property
    def preconditions(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.preconditions
        if hasattr(self, 'meeting') and self.meeting:
            if self.meeting.is_special:
                return self.meeting.preconditions
            else:
                return self.meeting.topic.preconditions
        return None

    @property
    def equipments(self):
        equipments = Equipment.objects.none()
        misc = ''
        if hasattr(self, 'tour') and self.tour:
            equipments = self.tour.equipments
            misc = self.tour.misc_equipment
        if hasattr(self, 'meeting') and self.meeting:
            if self.meeting.is_special:
                equipments = self.meeting.equipments
                misc = self.meeting.misc_equipment
            else:
                equipments = self.meeting.topic.equipments
                misc = self.meeting.topic.misc_equipment
        if hasattr(self, 'session') and self.session:
            equipments = self.session.equipments
            misc = self.session.misc_equipment
        equipment_list = []
        for equipment in equipments.all():
            equipment_list.append(dict(code=equipment.code, name=equipment.name))
        equipments = {}
        if equipment_list:
            equipments.update(dict(list=equipment_list))
        if misc:
            equipments.update(dict(misc=misc))
        return equipments if equipments else None

    @property
    def team(self):
        team = None
        if hasattr(self, 'tour') and self.tour:
            team = self.tour.team
        if hasattr(self, 'meeting') and self.meeting:
            team = self.meeting.team
        if hasattr(self, 'session') and self.session:
            team = self.session.team
        return ', '.join(team.values_list('user__username', flat=True)) if team else None

    @property
    def subject(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.subject()
        if hasattr(self, 'talk') and self.talk:
            return self.talk.subject()
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.subject()
        if hasattr(self, 'session') and self.session:
            return self.session.subject()

    @property
    def details(self):
        if hasattr(self, 'tour') and self.tour:
            return self.tour.details()
        if hasattr(self, 'talk') and self.talk:
            return self.talk.details()
        if hasattr(self, 'meeting') and self.meeting:
            return self.meeting.details()
        if hasattr(self, 'session') and self.session:
            return self.session.details()

    @property
    def dayfactor(self):
        """
        start_time >= midday -> half day
        start_time - end_time < 4 hours -> half day

        start_time > midday -> whole day
        start_time - end_time >= 4 hours -> whole day

        :return: half and whole days, which represents the duration of a specific event
        """

        return None


    class Meta:
        get_latest_by = "updated"
        verbose_name = "Veranstaltungstermin"
        verbose_name_plural = "Veranstaltungstermine"
        ordering = ('start_date', )
