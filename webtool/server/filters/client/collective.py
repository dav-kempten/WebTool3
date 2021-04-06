from django_filters import rest_framework as filters

from server.models import Collective, Guide


class CollectiveFilter(filters.FilterSet):

    manager = filters.CharFilter(label='manager', method='manager_filter')

    def manager_filter(self, queryset, name, value):
        try:
            manager = Guide.objects.get(user__username=value)
        except Guide.DoesNotExist:
            return Collective.objects.none()
        return queryset.filter(
            managers = manager
        ).distinct()

    class Meta:
        model = Collective
        fields = (
            'manager',
        )
