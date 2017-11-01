from django_filters import rest_framework as filters, STRICTNESS

from server.models import Guide


class GuideFilter(filters.FilterSet):

    firstName = filters.CharFilter(name='user__first_name', label='firstName')
    lastName = filters.CharFilter(name='user__last_name', label='lastName')
    collective = filters.CharFilter(label='collective', method='collective_filter')

    def collective_filter(self, queryset, name, value):
        return queryset.filter(collectives__category__code=value)

    class Meta:
        model = Guide
        fields = (
            'firstName',
            'lastName',
            'collective',
        )
        strict = STRICTNESS.RAISE_VALIDATION_ERROR
