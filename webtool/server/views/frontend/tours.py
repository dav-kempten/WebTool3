
from django.http import Http404
from rest_framework import permissions, mixins, viewsets, status
from django.template.defaultfilters import date
from rest_framework.response import Response

from server.models import Tour
from server.serializers.frontend.tours import TourListSerializer, TourSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object and member of staff to edit it.
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated and not request.user.is_staff and request.method == 'POST':
            if 'guideId' in request.data and request.data['guideId'] == request.user.id:
                return True
        authenticated_request = request.method == 'PUT' and request.user.is_authenticated
        return request.method in permissions.SAFE_METHODS or authenticated_request or request.user.is_staff

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests
        # or requests from staff.
        if request.method in permissions.SAFE_METHODS or request.user and request.user.is_staff:
            return True
        # User is only allowed to perform actions on own objects,
        # expect DELETE-Requests.
        if obj.guide is not None and obj.guide.user == request.user and request.method == 'PUT':
            # Only allow requests if tour and request is on stateId = 2 or less
            if obj.state.pk <= 2 and 'stateId' in request.data and request.data['stateId'] <= 2:
                # Users are not allowed to change guideId
                if 'guideId' in request.data and obj.guide.pk == request.data['guideId']:
                    return True
        return False


class TourViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):

    permission_classes = (IsOwnerOrReadOnly, )

    queryset = (
        Tour.objects
        .filter(deprecated=False, tour__season__current=True)
        # .exclude(state__done=True)
        # .exclude(state__canceled=True)
    )

    def get_serializer_class(self):
        if self.action == 'list':
            return TourListSerializer
        return TourSerializer

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

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def destroy(self, request, pk=None, *args, **kwargs):

        try:
            pk = int(pk)
        except ValueError:
            raise Http404

        instance = self.get_object()

        tour = instance.tour
        if tour:
            reference = tour.reference
            if reference:
                reference.deprecated = True
                reference.save()

            tour.deprecated = True
            tour.save()

        deadline = instance.deadline
        if deadline:
            reference = deadline.reference
            if reference:
                reference.deprecated = True
                reference.save()

            deadline.deprecated = True
            deadline.save()

        preliminary = instance.preliminary
        if preliminary:
            reference = preliminary.reference
            if reference:
                reference.deprecated = True
                reference.save()

            preliminary.deprecated = True
            preliminary.save()

        instance.deprecated = True
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)
