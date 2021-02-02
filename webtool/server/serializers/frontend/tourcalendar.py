from rest_framework import serializers

from server.models import Tour


class TourcalendarSerializerList(serializers.ModelSerializer):
    title = serializers.SerializerMethodField(read_only=True)
    start = serializers.DateField(source='tour.start_date', read_only=True)
    end = serializers.DateField(source='tour.end_date', read_only=True)

    class Meta:
        model = Tour
        fields = (
            'title',
            'start',
            'end'
        )

    def get_title(self, obj):
        return obj.tour.title
