# -*- coding: utf-8 -*-
import codecs
from datetime import datetime
import json

from django.core.management import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.dateparse import parse_datetime

from server.models import Profile, Guide, get_default_season, Equipment, Event, Qualification, UserQualification
from server.models.utils import create_tour

User = get_user_model()


def load_wt3_guides(guides):
    for data in guides:

        member_id = data['member_id']

        if member_id is None:
            continue

        username = data['id']
        email = data['email']
        first_name = data['first_name']
        last_name = data['last_name']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User.objects.create_user(username)
            user.set_unusable_password()
        if email:
            user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.isactive = True
        user.save()

        phone = data['phone']
        mobile = data['mobile']
        try:
            profile = Profile.objects.get(member_id=member_id)
        except Profile.DoesNotExist:
            profile = Profile(user=user, member_id=member_id)
        profile.phone = phone if phone else ''
        profile.mobile = mobile if mobile else ''
        profile.save()

        # Todo: Groups

        q_data = data['qualifications']
        for q in q_data:
            code = q[0]
            qualification = Qualification.objects.get(code=code)
            try:
                user_qualification = UserQualification.objects.get(user=user, qualification=qualification)
            except UserQualification.DoesNotExist:
                user_qualification = UserQualification(
                    user=user,
                    qualification=qualification,
                    year='1234',  # TODO!
                    aspirant=(code == "AW"),
                    inactive=(code == "WL")
                )
                user_qualification.save()

        try:
            guide = Guide.objects.get(user=user)
        except Guide.DoesNotExist:
            guide = Guide(user=user)
            guide.save()
            season = get_default_season()
            guide.seasons.add(season)


def load_server_guide(data):
    if data["season"] != 2:
        return
    member_id = data["member_id"]
    try:
        profile = Profile.objects.get(member_id=member_id)
    except Profile.DoesNotExist:
        return
    user = profile.user
    guide = user.guide
    if data["mobile_enable"] and data["_mobile"]:
        guide.mobile = data["_mobile"]
    if data["phone_enable"] and data["_phone"]:
        guide.phone = data["_phone"]
    if data["email_enable"] and data["_email"]:
        guide.email = data["_email"]
    guide.profile = data["profile"]
    guide.portrait = data["portrait"]
    guide.save()


def load_server_tour_proposal(element):

    START_DATE_TIME = parse_datetime("2017-08-01T00:00:00.000")

    class Data(object):
        def __init__(self, data):
            self.__dict__.update(data)

        @property
        def data(self):
            return self.__dict__

    pk = element["pk"]
    if pk < 211: # or element["fields"]["youth_part"]:
        return

    # approximate = 1 => Genau
    # approximate = 2 => Morgens
    # approximate = 3 => Vormittags
    # approximate = 4 => Mittags
    # approximate = 5 => Nachmittags
    # approximate = 6 => Abends
    approximates = ["genau", "morgens", "vormittags", "mittags", "nachmittags", "abends"]

    categories = {
        "SST": "SST",
        "BT": "BGT",
        "ST": "SKT",
        "SSHT": "SGH",
        "KS": "KSG",
        "FR": "FRD",
        "SHT": "SHT",
        "SBT": "SBD",
        "": "EBK",
        "MTB": "MTB"
    }

    tour = Data(
        dict(
            category="", title="", name="", guide="", deadline_date="", start_date="", start_time=None,
            approximate=None, end_date=None, end_time=None, preconditions="", min_quantity=3, max_quantity=6,
            admission=None, advances=None, advances_info="", extra_charges="", description="", rendezvous="",
            location="", source="", preliminary_date=None, preliminary_time=None, info=None, link="", map="",
            cover="", distal=None, distance=0, public_transport=False, low_emission_adventure=False,
            ladies_only=False, skill=None, fitness=None, state=None, season=None, qualifications=None,
            equipments=None, categories=None, misc_category="", team=None, message="", comment="",
            calc_budget=None, budget_info=""
        )
    )

    tour.comment = "Proposal-Key: {}".format(pk)
    proposal = Data(element["fields"])

    tour.public_transport = proposal.public_transport
    tour.low_emission_adventure = proposal.lea
    tour.guide = proposal.guide
    tour.team = proposal.team
    tour.deadline_date = proposal.deadline
    if proposal.meeting == 1:
        tour.preliminary_date = proposal.preliminary_date
        tour.preliminary_time = proposal.preliminary_time
    if proposal.meeting == 2:
        tour.info = proposal.preliminary_info[:75]
    tour.min_quantity = proposal.min_quantity
    tour.max_quantity = proposal.max_quantity
    tour.start_date = proposal.start_date

    if proposal.approximate > 1:
        tour.approximate = approximates[proposal.approximate - 1]
    else:
        tour.start_time = proposal.start_time

    tour.end_date = proposal.end_date
    tour.end_time = proposal.end_time
    tour.portal = proposal.portal
    tour.title = proposal.title[:30]
    tour.name = proposal.name[:125]
    tour.rendezvous = proposal.rendezvous[:75]
    tour.source = proposal.source[:75]
    tour.distance = proposal.distance
    tour.location = proposal.accommodation[:75]
    tour.category = categories[proposal.category.split(", ")[0]]
    tour.misc_category = proposal.misc_category
    # tour.equipment = proposal.equipment
    # tour.misc_equipment = proposal.misc_equipment
    tour.skill = proposal.skill
    tour.fitness = proposal.fitness
    tour.description = proposal.description
    # tour.qualifications = proposal.qualifications
    tour.preconditions = proposal.preconditions
    tour.advances = proposal.advances
    # tour.advances_info = proposal.advances_info
    tour.extra_charges = proposal.extra_charges
    # tour.extra_charges_info = proposal.extra_charges_info
    # tour.travel_cost = proposal.travel_cost
    tour.budget_info = proposal.budget_info
    # tour.budget = proposal.budget
    tour.admission = proposal.admission
    tour.message = proposal.info

    print("{} ({}) {}".format(pk, tour.category, tour.title))
    t = create_tour(**tour.data)
    if t is None:
        print("! {}".format(pk))

class Command(BaseCommand):
    help = 'Load data from dump file'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)

    def add_arguments(self, parser):
        parser.add_argument('data', type=str)

    def handle(self, *args, **options):
        path = options['data']
        with codecs.open(path, 'rb', 'utf-8') as content:
            elements = json.load(content)
        if (elements and isinstance(elements, dict) and
                    elements.get('description') == "WebTool 2.0 guide data exported for WebTool 3.0"):
            load_wt3_guides(elements['guides'])
        if elements and isinstance(elements, list) and {"model", "pk", "fields"} <= set(elements[0].keys()):
            for element in elements:
                if element["model"] == "server.guide":
                    data = element["fields"]
                    load_server_guide(data)
                elif element["model"] == "server.tourproposal":
                    load_server_tour_proposal(element)
