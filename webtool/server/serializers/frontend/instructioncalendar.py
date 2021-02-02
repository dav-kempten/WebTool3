from rest_framework import serializers

from server.models import Instruction


class InstructioncalendarSerializerList(serializers.ModelSerializer):
    title = serializers.SerializerMethodField(read_only=True)
    start = serializers.DateField(source='instruction.start_date', read_only=True)
    end = serializers.DateField(source='Instruction.end_date', read_only=True)

    class Meta:
        model = Instruction
        fields = (
            'title',
            'start',
            'end'
        )

    def get_title(self, obj):
        if obj.is_special:
            return obj.instruction.title
        else:
            return obj.topic.name
