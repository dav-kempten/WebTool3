# -*- coding: utf-8 -*-
from rest_framework import permissions, viewsets
from rest_framework.response import Response

from server.models import Requirement
from server.serializers.frontend.requirements import RequirementOverviewSerializer


class RequirementViewSet(viewsets.ViewSet):
    """Bedarf und Ist-Stand des laufenden Programmjahrs für das Dashboard.

    Nur lesend -- gepflegt werden die Bedarfe im Django-Admin.
    """

    permission_classes = (permissions.IsAuthenticated, )

    def list(self, request, *args, **kwargs):
        season = Requirement.planning_season()
        data = (
            Requirement.overview(season) if season is not None
            else Requirement.empty_overview(Requirement.program_year())
        )
        serializer = RequirementOverviewSerializer(data)
        response = Response(serializer.data)
        # Eine Liveansicht: jede Antwort zählt neu, nichts aus dem Cache.
        response['Cache-Control'] = 'no-store'
        return response
