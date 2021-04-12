from django.contrib.admin.apps import AdminConfig

class WebtoolAdminConfig(AdminConfig):
    default_site = 'webtool.admin.WebtoolAdminSite'
