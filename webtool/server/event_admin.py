from django.contrib import admin

from server.admin_filters import GuideTeamFilter


class InstructionAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Leitung', {
            'classes': ['collapse'],
            'fields': ('guide', 'team',)
        }),
        ('Veranstaltung', {
            'classes': ['collapse'],
            'fields': ('topic', 'instruction', 'ladies_only', 'is_special', 'category', 'min_quantity', 'max_quantity',
                       'cur_quantity', 'qualifications', 'preconditions', 'equipments', 'misc_equipment', 'equipment_service')
        }),
        ('Kosten', {
            'classes': ['collapse'],
            'fields': ('calc_budget', 'real_costs', 'admission', 'advances', 'advances_info', 'extra_charges',
                       'extra_charges_info',)
        }),
    )

    list_filter = (GuideTeamFilter,)


class TourAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Leitung', {
            'classes': ['collapse'],
            'fields': ('guide', 'team',)
        }),
        ('Termine', {
            'classes': ['collapse'],
            'fields': ('tour', 'deadline', 'preliminary', 'info')
        }),
        ('Veranstaltung', {
            'classes': ['collapse'],
            'fields': ('categories', 'misc_category', 'ladies_only', 'youth_on_tour', 'relaxed',
                       'min_quantity', 'max_quantity', 'cur_quantity', 'qualifications', 'preconditions', 'equipments',
                       'misc_equipment', 'equipment_service', 'portal')
        }),
        ('Kosten', {
            'classes': ['collapse'],
            'fields': ('calc_budget', 'real_costs', 'admission', 'advances', 'advances_info', 'extra_charges',
                       'extra_charges_info',)
        }),
    )

    list_filter = (GuideTeamFilter,)