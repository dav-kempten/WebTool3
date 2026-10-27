# -*- coding: utf-8 -*-
from rest_framework import serializers


class SupportRequestSerializer(serializers.Serializer):
    """Eine Supportanfrage aus dem Dashboard.

    Absender und Rolle kommen aus der Sitzung und nicht aus dem Formular --
    sonst könnte man sie beliebig angeben.
    """

    subject = serializers.CharField(
        max_length=120, trim_whitespace=True, allow_blank=False,
        error_messages={'blank': 'Bitte einen Betreff angeben.'},
    )
    message = serializers.CharField(
        max_length=5000, trim_whitespace=True, allow_blank=False,
        error_messages={'blank': 'Bitte beschreiben, worum es geht.'},
    )
