# -*- coding: utf-8 -*-
import codecs
from datetime import datetime
import json

from django.core.management import BaseCommand
from django.contrib.auth import get_user_model

from server.models import Profile, Guide, get_default_season, Equipment, Event, Qualification, UserQualification

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
