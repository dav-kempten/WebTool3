# -*- coding: utf-8 -*-
from django.contrib.auth import login, authenticate
from rest_framework import views, permissions
from rest_framework.response import Response

from server.serializers.auth.login import LoginSerializer
from server.serializers.auth.user import UserSerializer


class LoginView(views.APIView):
    permission_classes = (permissions.AllowAny,)

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
