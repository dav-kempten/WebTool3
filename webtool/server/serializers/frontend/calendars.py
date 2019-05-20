from rest_framework import serializers

from server.models import Calendar


class CalendarListSerializer(serializers.HyperlinkedModelSerializer):

    id = serializers.IntegerField(source='pk')
    year = serializers.SerializerMethodField()

    class Meta:
        model = Calendar
        fields = (
            'id', 'year', 'url'
        )

    def get_year(self, obj):
        return int(obj.season.name)


class AnniversarySerializer(serializers.Serializer):

    id = serializers.IntegerField()
    name = serializers.CharField()
    date = serializers.SerializerMethodField()
    publicHoliday = serializers.BooleanField(source='public_holiday')

    def get_date(self, obj):
        return obj.date(year=self.context.get('year'))


class VacationSerializer(serializers.Serializer):

    id = serializers.IntegerField()
    name = serializers.CharField()
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')


class CalendarSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(source='pk')
    year = serializers.SerializerMethodField()
    anniversaries = serializers.SerializerMethodField()
    vacations = VacationSerializer(source='vacation_list', many=True)

    class Meta:
        model = Calendar
        fields = (
            'id', 'year', 'anniversaries', 'vacations'
        )

    def get_year(self, obj):
        return int(obj.season.name)

    def get_anniversaries(self, obj):
        serializer = AnniversarySerializer(
            obj.anniversary_list.filter(deprecated=False), many=True,
            context=dict(year=int(obj.season.name))
        )
        return serializer.data
