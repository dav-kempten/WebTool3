from django_filters import rest_framework as filters

from server.models import Topic, CategoryGroup


class TopicFilter(filters.FilterSet):

    group = filters.NumberFilter(label='group', method='categorygroup_filter')

    def categorygroup_filter(self, queryset, name, value):
        try:
            group = CategoryGroup.objects.get(pk=value)
        except CategoryGroup.DoesNotExist:
            return Topic.objects.none()
        return queryset.filter(
            category__in=group.categories.all()
        ).distinct()

    class Meta:
        model = Topic
        fields = (
            'group',
        )
