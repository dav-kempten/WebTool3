# -*- coding: utf-8 -*-

from rest_framework import permissions


class IsApprovedOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view):

        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        user = request.user

        if user and user.is_authenticated:

            if user.is_superuser:
                return True

            if request.method == "DELETE":
                return False

            if user.is_staff:
                return True

            if request.method in permissions.SAFE_METHODS:
                return True

            if hasattr(obj, "tour") and obj.tour:
                return obj.tour.guide.user == user
            elif hasattr(obj, "meeting") and obj.meeting:
                return obj.meeting.guide.user == user
            elif hasattr(obj, "session") and obj.session:
                return obj.session.collective.managers.filter(user=user).exists()

        return False
