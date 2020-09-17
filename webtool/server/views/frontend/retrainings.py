# -*- coding: utf-8 -*-
from django.http import Http404
from django.template.defaultfilters import date
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.response import Response

from server.models import Retraining
from server.serializers.frontend.retrainings import RetrainingListSerializer

class IsStaffOrReadOnly(permissions.BasePermission):
    """
    The request is authenticated for a staff user, or is a read-only request.
    """

    def has_permission(self, request, view):
        return (
            request.method in permissions.SAFE_METHODS or
            request.user and
            request.user.is_staff
        )

class RetrainingViewSet(viewsets.mixins.ListModelMixin, viewsets.GenericViewSet):

    permission_classes = (IsStaffOrReadOnly, )

    queryset = Retraining.objects\
        .exclude(deprecated=True)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = RetrainingListSerializer(queryset, many=True)
        response = Response(serializer.data)

        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            latest = queryset.latest()
            response['ETag'] = '"{}"'.format(latest.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(latest.updated, "D, d M Y H:i:s"))
        return response

    class Meta:
        model = Retraining
