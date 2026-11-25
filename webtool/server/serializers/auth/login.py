# -*- coding: utf-8 -*-
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    """
    Trainer schicken nur ihre Mitgliedsnummer, Personal Benutzername und
    Passwort. Wer passt, entscheiden die Backends in authenticate(); eine
    eigene Benutzersuche hier verriet nur, ob es ein Konto gibt.
    """

    username = serializers.CharField(allow_blank=True, required=False, default='')
    password = serializers.CharField(allow_blank=True, required=False, default='')
    member_id = serializers.CharField(allow_blank=True, required=False, default='')
