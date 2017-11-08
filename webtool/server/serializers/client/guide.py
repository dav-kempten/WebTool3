import json
from urllib.parse import urlparse

from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import Guide


class GuideListSerializer(serializers.ModelSerializer):

    id = serializers.CharField(source='user.username')
    firstName = serializers.CharField(source='user.first_name')
    lastName = serializers.CharField(source='user.last_name')
    qualification = serializers.SerializerMethodField()
    portrait = serializers.SerializerMethodField()
    detail = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        fields = (
            'id',
            'firstName', 'lastName',
            'qualification',
            'portrait',
            'detail'
        )
        extra_kwargs = {'id': {'lookup_field': 'username'}}

    def get_qualification(self, obj):
        qualification_list = (
            obj.user.qualification_list.exclude(
                qualification__name__in=["Anwärter", "Kletterassistent (Kempten)"]
            ).values_list('qualification__name',flat=True)
        )
        qualification =  ', '.join(qualification_list)
        return (
            qualification.replace('Fachübungsleiter', 'FÜL')
                .replace('Zusatzqualifikation', 'ZQ')
                .replace('Trainer ', 'T')
                .replace('JDAV-', '')
        ) if qualification else None

    def get_detail(self, obj):
        request = self.context['request']
        return reverse('guide-detail', kwargs={'username': obj.user.username}, request=request)

    def get_portrait(self, obj):
        request = self.context['request']
        url = request.build_absolute_uri()
        parts = urlparse(url)
        return "{}://{}/guides/{}".format(parts.scheme, parts.netloc, obj.portrait) if obj.portrait else None


class GuideSerializer(GuideListSerializer):

    profile = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()

    class Meta(GuideListSerializer.Meta):
        fields = (
            'id',
            'firstName', 'lastName',
            'portrait',
            'profile',
            'email', 'phone', 'mobile',
            'links'
        )

    def get_profile(self, obj):
        return json.loads(obj.profile, encoding='utf-8') if obj.profile else None

    def get_links(self, obj):
        request = self.context['request']
        result =  {
            'guidedTours': None,
            'supportedTours': None,
            'guidedSessions': None,
            'supportedSessions': None,
            'guidedInstructions': None,
            'supportedInstructions': None,
            'managedCollectives': None
        }

        if obj.tour_guides.exists():
            username = obj.user.get_username()
            result["guidedTours"] = "{}?activity=tour&guide={}".format(reverse('event-list', request=request), username)

        if obj.tour_teamers.exists():
            username = obj.user.get_username()
            result["supportedTours"] = "{}?activity=tour&team={}".format(reverse('event-list', request=request), username)

        if obj.session_guides.exists():
            username = obj.user.get_username()
            result["guidedSessions"] = "{}?activity=collective&guide={}".format(reverse('event-list', request=request), username)

        if obj.session_teamers.exists():
            username = obj.user.get_username()
            result["supportedSessions"] = "{}?activity=collective&team={}".format(reverse('event-list', request=request), username)

        if obj.instruction_guides.exists():
            username = obj.user.get_username()
            result["guidedInstructions"] = "{}?activity=topic&guide={}".format(reverse('event-list', request=request), username)

        if obj.instruction_teamers.exists():
            username = obj.user.get_username()
            result["supportedInstructions"] = "{}?activity=topic&team={}".format(reverse('event-list', request=request), username)

        return result
