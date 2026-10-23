from django.contrib import admin
from django.contrib.auth.admin import User
from server.models.collective import Collective, Session, Role
from server.models.qualification import Qualification, QualificationGroup
from server.models.instruction import Instruction, Topic
from server.models.category import Category, CategoryGroup
from server.models.tour import Tour
from server.models.equipment import Equipment
from server.models.calendar import Calendar, Anniversary, Vacation
from server.user_admin import UserAdmin
from server.event_admin import InstructionAdmin, TourAdmin
from server.inlines import RoleInline


class RoleAdmin(admin.ModelAdmin):
    """Roles (Aufgaben) of guides in groups, formerly only editable in the shell."""
    list_display = ('manager', 'collective', 'order', 'description')
    list_display_links = ('manager', 'collective')
    list_filter = ('collective',)
    search_fields = (
        'manager__user__last_name', 'manager__user__first_name', 'collective__title', 'collective__name',
    )
    list_select_related = ('manager__user', 'collective__category')
    fields = ('collective', 'manager', 'order', 'description')

    def lookup_allowed(self, lookup, value, request=None):
        # A group's primary key is its OneToOne link to Category, so the group
        # filter's own lookup reads as a second relation hop to Django, which
        # then rejects it ("Filtering by collective__category__exact not allowed").
        if lookup == 'collective__category__exact':
            return True
        return super().lookup_allowed(lookup, value, request)


class CollectiveAdmin(admin.ModelAdmin):
    # The roles of a group can be edited right on the group as well.
    inlines = (RoleInline,)

# Register your models here.

# Auth.User
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Calendar
admin.site.register(Calendar)
admin.site.register(Anniversary)
admin.site.register(Vacation)

# Collective
admin.site.register(Collective, CollectiveAdmin)
admin.site.register(Session)
admin.site.register(Role, RoleAdmin)

# Qualifications
admin.site.register(Qualification)
admin.site.register(QualificationGroup)

# Mixins
admin.site.register(Category)
admin.site.register(CategoryGroup)
admin.site.register(Tour, TourAdmin)
admin.site.register(Equipment)

# Instructions
admin.site.register(Instruction, InstructionAdmin)
admin.site.register(Topic)
