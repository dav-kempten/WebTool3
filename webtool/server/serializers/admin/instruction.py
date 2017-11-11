# -*- coding: utf-8 -*-

from rest_framework.reverse import reverse
from rest_framework import serializers

from server.models import Event, Instruction, Guide, Topic
from server.models.utils import create_reference


class MeetingSerializer(serializers.Serializer):

    title = serializers.CharField(allow_blank=True, allow_null=True, default='')
    name = serializers.CharField(allow_blank=True, allow_null=True, default='')
    description = serializers.CharField(allow_blank=True, default='')
    startDate = serializers.DateField(source="start_date")
    startTime = serializers.TimeField(source="start_time", default=None, allow_null=True)
    approximate = serializers.CharField(default=None, allow_null=True)
    endDate = serializers.DateField(source="end_date", default=None, allow_null=True)
    endTime = serializers.TimeField(source="end_time", default=None, allow_null=True)
    rendezvous = serializers.CharField(allow_blank=True, default='')
    location = serializers.CharField(allow_blank=True, default='')
    source = serializers.CharField(allow_blank=True, default='')
    link = serializers.CharField(allow_blank=True, default='')
    map = serializers.CharField(allow_blank=True, default='')
    distal = serializers.BooleanField(default=False)
    distance = serializers.IntegerField(default=0)
    publicTransport = serializers.BooleanField(source="public_transport", default=False)
    reference = serializers.CharField(default=None, allow_null=True)


class QuantitySerializer(serializers.Serializer):

    min = serializers.IntegerField(source="min_quantity", default=3)
    max = serializers.IntegerField(source="max_quantity", default=6)
    current = serializers.IntegerField(source="cur_quantity")


class InstructionSerializer(MeetingSerializer):

    lowEmissionAdventure = serializers.BooleanField(source="lea", default=False)
    quantity = QuantitySerializer(source='meeting')
    ladiesOnly = serializers.BooleanField(source="meeting.ladies_only", default=False)
    topic = serializers.CharField(source='meeting.topic.category.code')
    admission = serializers.DecimalField(source="meeting.admission", max_digits=6, decimal_places=2, default=0.0)
    advances = serializers.DecimalField(source="meeting.advances", max_digits=6, decimal_places=2, default=0.0)
    advancesInfo = serializers.CharField(source="meeting.advances_info", allow_blank=True, default='')
    extraCharges = serializers.DecimalField(source="meeting.extra_charges", max_digits=6, decimal_places=2, default=0.0)
    extraChargesInfo = serializers.CharField(source="meeting.extra_charges_info", allow_blank=True, default='')
    message = serializers.CharField(source="meeting.message", allow_blank=True, default='')
    comment = serializers.CharField(source="meeting.comment", allow_blank=True, default='')
    budgetInfo = serializers.JSONField(source="meeting.budget_info", allow_null=True, default=None)
    state = serializers.IntegerField(source="meeting.state.order", default=0, min_value=0)
    guide = serializers.CharField(source="meeting.guide.user.username", allow_null=True, default=None)
    team = serializers.CharField(allow_null=True, default=None)
    meetings = MeetingSerializer(source="meeting.meeting_list", many=True, allow_null=True, default=None)

    def create(self, validated_data):
        reference = validated_data.pop('reference')
        assert reference is None
        instruction = validated_data.pop('meeting')

        guide = None
        username = instruction.pop('guide').pop('user').pop('username')
        if isinstance(username, str):
            guide = Guide.objects.get(user__username=username)

        meetings = instruction.pop('meeting_list')
        state = instruction.pop('state').pop('order')

        team = validated_data.pop('team')
        if isinstance(team, str):
            team = Guide.objects.filter(user__username__in=team.split(', '))

        category = instruction.pop('topic').pop('category').pop('code')
        start_date = validated_data.get('start_date')
        prefix = str(start_date.year)[-1]
        reference = create_reference(category, prefix=prefix, topic=True)
        category = reference.category
        season = reference.season
        topic = Topic.objects.get(seasons=season, category=category)
        event = Event.objects.create(season=season, reference=reference, new=True, **validated_data)
        instruction = Instruction.objects.create(
            topic=topic, guide=guide, instruction=event, state_id=5, **instruction
        )
        if team:
            instruction.team = team

        if meetings:
            for meeting in meetings:
                reference = meeting.pop('reference')
                assert reference is None
                reference = create_reference(prefix=prefix, meeting=True)
                event = Event.objects.create(season=season, reference=reference, instruction=instruction, **meeting)

        return instruction


class InstructionListSerializer(serializers.Serializer):

    reference = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    start_date = serializers.DateField(read_only=True)
    end_date = serializers.DateField(allow_null=True, default=None, read_only=True)
    detail = serializers.SerializerMethodField(read_only=True)

    def get_detail(self, obj):
        request = self.context['request']
        return reverse('instruction-detail', kwargs={'reference': str(obj.reference)}, request=request)
