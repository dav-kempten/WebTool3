from rest_framework import serializers

from server.models import Calendar


class CalendarListSerializer(serializers.HyperlinkedModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    year = serializers.SerializerMethodField()

    class Meta:
        model = Calendar
        fields = (
            'id', 'year', 'url'
        )

    def get_year(self, obj):
        return int(obj.season.name)


class AnniversarySerializer(serializers.Serializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    name = serializers.CharField(read_only=True)
    date = serializers.SerializerMethodField()
    publicHoliday = serializers.BooleanField(source='public_holiday', read_only=True)

    def get_date(self, obj):
        return obj.date(year=self.context.get('year'))


class VacationSerializer(serializers.Serializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    name = serializers.CharField(read_only=True)
    startDate = serializers.DateField(source='start_date', read_only=True)
    endDate = serializers.DateField(source='end_date', read_only=True)


class CalendarSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
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
