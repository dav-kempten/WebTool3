# -*- coding: utf-8 -*-
from django.http import Http404
from django.template.defaultfilters import date

from rest_framework import viewsets
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from server.models import Instruction # , State
from server.serializers.frontend.instructions import InstructionListSerializer, InstructionSerializer


class InstructionViewSet(viewsets.ModelViewSet):

    queryset = (
        Instruction.objects
        .filter(deprecated=False, instruction__season__current=True)
        # .exclude(state_id=State.objects.get(seasons__current=True, done=True).pk)
    )

    def get_serializer_class(self):
        if self.action == 'list':
            return InstructionListSerializer
        return InstructionSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})

        response = Response(serializer.data)
        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            latest = queryset.latest()
            response['ETag'] = '"{}"'.format(latest.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(latest.updated, "D, d M Y H:i:s"))
        return response

    def retrieve(self, request, pk=None, *args, **kwargs):

        try:
            pk = int(pk)
        except ValueError:
            raise Http404

        queryset = self.get_queryset()
        instance = get_object_or_404(queryset, pk=pk)
        serializer = self.get_serializer(instance)
        response = Response(serializer.data)
        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            response['ETag'] = '"{}"'.format(instance.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
        return response

    def create(self, request, *args, **kwargs):
        raise Http404

    def update(self, request, *args, **kwargs):
        raise Http404

    def destroy(self, request, *args, **kwargs):
        raise Http404

    def partial_update(self, request, *args, **kwargs):
        raise Http404
