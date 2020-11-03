from django.contrib import admin
from django.contrib.auth.admin import User
from server.models.collective import Collective, Session
from server.models.qualification import Qualification, QualificationGroup
from server.models.instruction import Instruction, Topic
from server.models.category import Category, CategoryGroup
from server.models.tour import Tour
from server.models.equipment import Equipment
from server.models.calendar import Calendar, Anniversary, Vacation
from server.user_admin import UserAdmin

# Register your models here.

# Auth.User
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Calendar
admin.site.register(Calendar)
admin.site.register(Anniversary)
admin.site.register(Vacation)

# Collective
admin.site.register(Collective)
admin.site.register(Session)

# Qualifications
admin.site.register(Qualification)
admin.site.register(QualificationGroup)

# Mixins
admin.site.register(Category)
admin.site.register(CategoryGroup)
admin.site.register(Tour)
admin.site.register(Equipment)

# Instructions
admin.site.register(Instruction)
admin.site.register(Topic)
