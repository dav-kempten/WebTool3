import json
from urllib.parse import urlparse

from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import Guide


class GuideListSerializer(serializers.ModelSerializer):

    id = serializers.CharField(source='user.username')
    firstName = serializers.CharField(source='user.first_name')
    lastName = serializers.CharField(source='user.last_name')
    portrait = serializers.SerializerMethodField()
    detail = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        fields = (
            'id',
            'firstName', 'lastName',
            'portrait',
            'detail'
        )
        extra_kwargs = {'id': {'lookup_field': 'username'}}

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
            result["guidedTours"] = "{}?guide={}".format(reverse('event-list', request=request), username)

        return result
