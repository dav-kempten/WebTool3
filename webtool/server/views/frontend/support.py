# -*- coding: utf-8 -*-
import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone

from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from server.models import Guide
from server.serializers.frontend.support import SupportRequestSerializer

logger = logging.getLogger(__name__)


class SupportViewSet(viewsets.ViewSet):
    """Nimmt Supportanfragen aus dem Dashboard entgegen und mailt sie weiter."""

    permission_classes = (permissions.IsAuthenticated, )

    def create(self, request, *args, **kwargs):
        serializer = SupportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        message = EmailMessage(
            subject='{} {}'.format(
                settings.SUPPORT_SUBJECT_PREFIX, serializer.validated_data['subject']
            ),
            body=self.body(user, serializer.validated_data['message']),
            from_email=settings.SUPPORT_FROM_EMAIL,
            to=list(settings.SUPPORT_RECIPIENTS),
            # Damit eine Antwort beim Absender und nicht beim Server landet.
            reply_to=[user.email] if user.email else None,
        )

        try:
            message.send(fail_silently=False)
        except Exception:
            # Ein defekter Mailweg darf nicht als stiller Erfolg durchgehen:
            # der Absender glaubte sonst, seine Frage sei unterwegs.
            logger.exception('Supportanfrage von %s konnte nicht gesendet werden', user)
            return Response(
                {'detail': 'Die Nachricht konnte nicht versendet werden. '
                           'Bitte wende dich direkt an {}.'.format(settings.SUPPORT_RECIPIENTS[0])},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {'detail': 'Deine Nachricht ist unterwegs.'}, status=status.HTTP_201_CREATED
        )

    @staticmethod
    def body(user, text):
        """Wer fragt, steht oben -- sonst muss man es aus der Antwort raten."""
        guide = Guide.objects.filter(user=user).first()
        lines = [
            'Von: {} ({})'.format(user.get_full_name() or user.get_username(), user.get_username()),
            'E-Mail: {}'.format(user.email or 'nicht hinterlegt'),
            'Rolle: {}'.format(role_of(user)),
        ]
        if guide is not None:
            lines.append('Trainer-ID: {}'.format(guide.pk))
        lines.append('Gesendet: {}'.format(timezone.localtime().strftime('%d.%m.%Y %H:%M')))
        lines.append('')
        lines.append(text)
        return '\n'.join(lines)


def role_of(user):
    """Dieselbe Einstufung wie im Login (serializers/auth/user.py)."""
    if user.is_superuser:
        return 'Administrator'
    if user.is_staff:
        return 'Geschäftsstelle'
    if user.qualification_list.exists():
        return 'Trainer'
    return 'ohne Rolle'
