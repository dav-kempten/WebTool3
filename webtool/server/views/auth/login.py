# -*- coding: utf-8 -*-
from django.contrib.auth import login, authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import views, permissions
from rest_framework.response import Response

from server.serializers.auth.login import LoginSerializer
from server.serializers.auth.user import UserSerializer


class LoginView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        """
        The user of the current session, or {} if there is none. Lets a freshly
        opened tab pick up an existing login instead of asking again.
        """
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        return Response({})

    def post(self, request):

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = authenticate(request, **data)
        try:
            login(request, user)
        except ValueError:
            pass
        return Response(UserSerializer(user).data)
