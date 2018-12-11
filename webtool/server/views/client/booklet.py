# -*- coding: utf-8 -*-
from rest_framework import viewsets
from rest_framework import mixins
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework import status
from rest_framework.response import Response


from server.models import Booklet
from server.serializers.client import BookletSerializer, BookletListSerializer, BookletRetrieveSerializer


class BookletViewSet(mixins.CreateModelMixin,
                     mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     mixins.DestroyModelMixin, viewsets.GenericViewSet):

    queryset = Booklet.objects.filter(deprecated=False)

    def destroy(self, request, pk=None, *args, **kwargs):
        if Booklet.objects.get(pk=pk).status != Booklet.STATUS_DONE:
            return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
        return super(BookletViewSet, self).destroy(request, pk, *args, **kwargs)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BookletRetrieveSerializer
        if self.action == 'list':
            return BookletListSerializer
        return BookletSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    class Meta:
        model = Booklet
