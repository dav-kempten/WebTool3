# -*- coding: utf-8 -*-
from django.contrib.auth import logout
from rest_framework import views, response, permissions


class LogoutView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        logout(request)
        return response.Response()
