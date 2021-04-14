def import_wt2_guides(path="wt3_guide-data.json"):
    import json
    from django.contrib.auth import get_user_model
    from django.utils.dateparse import parse_date
    from server.models import get_default_season
    from server.models import Guide, Profile, Qualification, UserQualification, Retraining

    def is_integral_member(category):
        return category in (1000, 1100, 1900, 2000, 2300, 2400, 2500, 2600, 2700, 2900)

    User = get_user_model()
    season = get_default_season()

    with open(path, 'r', encoding="utf-8") as wt3_data:
        data = json.load(wt3_data)

    guides_data = data.get('guides', [])
    for guide_data in guides_data:
        if 'Unbekannt' == guide_data['id']:
            continue

        if 'Geschäftsstelle' in guide_data['groups']:
            continue

        if 'Administrator' in guide_data['groups']:
            continue

    profile = None
    user = None
    guide = None

    member_id = guide_data.get('member_id')
    username = guide_data.get('id')
    try:
        profile = Profile.objects.get(member_id=member_id)
        user = profile.user
    except Profile.DoesNotExist:
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User.objects.create_user(username)
            user.set_unusable_password()

    email = guide_data['email']
    first_name = guide_data['first_name']
    last_name = guide_data['last_name']
    if email:
        user.email = email
    user.first_name = first_name
    user.last_name = last_name
    user.is_active = True
    user.save()

    if profile is None:
        profile = Profile.objects.create(user=user, member_id=member_id)

    phone = guide_data['phone']
    mobile = guide_data['mobile']
    birth_date = guide_data['birth_date']
    birth_date = parse_date(birth_date) if birth_date else None
    member_category = guide_data['member_category']
    member_home = guide_data['member_home']
    member_year = guide_data['member_year']
    member_note = guide_data['note']
    title = guide_data['title']
    sex = 0
    if title == 'Herrn':
        sex = 1
    elif title == "Frau":
        sex = 2

    profile.sex = sex
    profile.phone = phone if phone else ''
    profile.mobile = mobile if mobile else ''
    profile.birth_date = birth_date
    profile.member_year = member_year if member_id else None
    profile.integral_member = is_integral_member(member_category)
    profile.member_home = member_home if member_home and not profile.integral_member else ''
    profile.note = member_note if member_note else ''
    profile.save()

    if guide is None:
        try:
            guide = Guide.objects.get(user=user)
        except Guide.DoesNotExist:
            guide = Guide.objects.create(user=user)
            guide.seasons.add(season)

    for rt in Retraining.objects.filter(user=user):
        rt.delete()

    for uq in UserQualification.objects.filter(user=user):
        uq.delete()

    qualifications = guide_data.get('qualifications', [])
    for code, name, year, note, inactive in qualifications:
        qualification = Qualification.objects.get(code=code if code != 'TBSHT' else 'TBSH')
        UserQualification.objects.create(qualification=qualification, user=user, year=year, inactive=inactive)

    retrainings = guide_data.get('retrainings')
    if retrainings:
        for code, name, year, specific, description, note in retrainings:
            qualification = UserQualification.objects.get(
                            user=user, qualification=Qualification.objects.get(code=code if code != 'TBSHT' else 'TBSH')
            ) if specific else None
            Retraining.objects.create(
            user=user, qualification=qualification, year=year, specific=specific,
            description=description, note=note
            )

    print(user, guide, profile.member_id)