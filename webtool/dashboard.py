from django.urls import reverse
from django.utils.translation import ugettext_lazy as _

from jet.dashboard import modules
from jet.dashboard.dashboard import Dashboard, AppIndexDashboard
from jet.utils import get_admin_site_name


class CustomIndexDashboard(Dashboard):
    columns = 2

    def init_with_context(self, context):
        self.available_children.append(modules.LinkList)

        self.children.append(modules.AppList(
            _('Applications'),
            column=0,
            order=0
        ))

        self.children.append(modules.RecentActions(
            _('Kürzliche Aktionen'),
            10,
            column=1,
            order=0
        ))

        site_name = get_admin_site_name(context)
        # append a link list module for "quick links"
        self.children.append(modules.LinkList(
            _('Schnellzugriff'),
            layout='inline',
            draggable=False,
            deletable=False,
            collapsible=False,
            children=[
                [_('Return to site'), '/'],
                [_('Change password'),
                 reverse('%s:password_change' % site_name)],
                [_('Log out'), reverse('%s:logout' % site_name)],
            ],
            column=1,
            order=1
        ))

        self.children.append(modules.LinkList(
            _('Hilfreiche Links'),
            children=[
                {
                    'title': _('Django documentation'),
                    'url': 'http://docs.djangoproject.com/',
                    'external': True,
                },
                {
                    'title': _('DAV Homepage'),
                    'url': 'https://www.alpenverein.de/',
                    'external': True,
                },
                {
                    'title': _('DAV Sektion Allgäu-Kempten'),
                    'url': 'https://www.dav-kempten.de/',
                    'external': True,
                },
                {
                    'title': _('DAV Sektion Allgäu-Kempten - Typo3'),
                    'url': 'https://www.dav-kempten.de/typo3/',
                    'external': True,
                },
            ],
            column=1,
            order=2
        ))
