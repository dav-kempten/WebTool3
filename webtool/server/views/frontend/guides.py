# -*- coding: utf-8 -*-
from django.http import Http404
from django.template.defaultfilters import date
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.response import Response

from server.models import Guide
from server.serializers.frontend.guides import GuideListSerializer, GuideSerializer


class IsGuideOwnerOrStaffOrReadOnly(permissions.BasePermission):
    """
    Safe methods are readable, staff may manage all guides, and a logged-in
    trainer may update (PUT/PATCH) their own Steckbrief.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_staff:
            return True
        return request.method in ('PUT', 'PATCH')

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_staff:
            return True
        return request.method in ('PUT', 'PATCH') and obj.user == request.user


class GuideViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):

    permission_classes = (IsGuideOwnerOrStaffOrReadOnly, )

    queryset = Guide.objects.select_related('user')

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            return qs.filter(user__is_active=True, deprecated=False, unknown=False)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return GuideListSerializer
        return GuideSerializer

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

    def retrieve(self, request, pk=None, *args, **kwargs):

        try:
            pk = int(pk)
        except ValueError:
            raise Http404

        queryset = self.get_queryset()
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response = Response(serializer.data)
        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            response['ETag'] = '"{}"'.format(instance.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
        return response

    def update(self, request, pk=None, *args, **kwargs):

        try:
            pk = int(pk)
        except ValueError:
            raise Http404

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def partial_update(self, request, pk=None, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, pk=pk, *args, **kwargs)

    def destroy(self, request, pk=None, *args, **kwargs):

        try:
            pk = int(pk)
        except ValueError:
            raise Http404

        instance = self.get_object()

        user = instance.user
        if user:
            user.is_active = False
            user.save()

        instance.is_active = False
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)
