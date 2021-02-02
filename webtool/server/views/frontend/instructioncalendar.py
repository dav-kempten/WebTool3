from rest_framework import mixins, viewsets
from rest_framework.response import Response

from django.template.defaultfilters import date

from server.models import Instruction
from server.serializers.frontend.instructioncalendar import InstructioncalendarSerializerList


class InstructioncalendarViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = (
        Instruction.objects
        .filter(deprecated=False, instruction__season__current=True)
    )

    def get_serializer_class(self):
        return InstructioncalendarSerializerList

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context=dict(request=request))

        response = Response(serializer.data)
        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            latest = queryset.latest()
            response['ETag'] = '"{}"'.format(latest.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(latest.updated, "D, d M Y H:i:s"))
        return response
