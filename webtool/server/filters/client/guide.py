from django_filters import rest_framework as filters, STRICTNESS

from server.models import Guide


class GuideFilter(filters.FilterSet):

    id = filters.NumberFilter(name='user_id', label='id', min_value=1)
    firstName = filters.CharFilter(name='first_name', label='firstName')
    lastName = filters.CharFilter(name='last_name', label='lastName')
    collective = filters.NumberFilter(label='collective', method='collective_filter', min_value=1)

    def collective_filter(self, queryset, name, value):
        return queryset.filter(collectives=value)

    class Meta:
        model = Guide
        fields = (
            'id',
            'firstName',
            'lastName',
            'collective',
        )
        strict = STRICTNESS.RAISE_VALIDATION_ERROR
