from django_filters import rest_framework as filters, STRICTNESS

from server.models import Guide


class GuideFilter(filters.FilterSet):

    firstName = filters.CharFilter(field_name='user__first_name', label='firstName')
    lastName = filters.CharFilter(field_name='user__last_name', label='lastName')
    collective = filters.CharFilter(label='collective', method='collective_filter', max_length=3, min_length=3)

    def collective_filter(self, queryset, name, value):
        return(
            queryset
                .filter(collectives__category__code__iexact=value)
                .order_by('role_list__order', 'user__last_name', 'user__first_name')
        )

    class Meta:
        model = Guide
        fields = (
            'firstName',
            'lastName',
            'collective',
        )
        strict = STRICTNESS.RAISE_VALIDATION_ERROR
