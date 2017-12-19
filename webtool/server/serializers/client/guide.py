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
    job = serializers.SerializerMethodField()
    portrait = serializers.SerializerMethodField()
    detail = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        fields = (
            'id',
            'firstName', 'lastName',
            'qualification',
            'job',
            'portrait',
            'detail'
        )
        extra_kwargs = {'id': {'lookup_field': 'username'}}

    def get_job(self, obj):
        profile = json.loads(obj.profile, encoding='utf-8') if obj.profile else None
        if profile:
            return profile.get('job')
        return None

    def get_qualification(self, obj):
        return obj.qualification_list()

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
        profile = json.loads(obj.profile, encoding='utf-8') if obj.profile else None
        if profile:
            qualification_list = obj.qualification_list()
            profile.update({"qualification": qualification_list})
        return profile

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

        if obj.collectives.filter(internal=False).exists():
            username = obj.user.get_username()
            result["managedCollectives"] = "{}?manager={}".format(reverse('collective-list', request=request), username)

        return result
