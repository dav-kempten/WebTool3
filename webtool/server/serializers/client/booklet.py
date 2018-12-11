# -*- coding: utf-8 -*-
from urllib.parse import urlparse

from rest_framework import serializers
from server.models import Booklet

from server.models import Reference


class BookletListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Booklet
        fields = ("id", "status")
        read_only_fields = ("status",)


class BookletRetrieveSerializer(BookletListSerializer):

    booklet = serializers.SerializerMethodField(read_only=True)

    def get_booklet(self, obj):
        if obj.status == Booklet.STATUS_DONE:
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri()
                parts = urlparse(url)
                return "{}://{}/booklets/{}.pdf".format(parts.scheme, parts.netloc, obj.id)
            else:
                return None
        else:
            return None

    class Meta(BookletListSerializer.Meta):
        fields = ("id", "status", "booklet")
        read_only_fields = ("status", "booklet")


class BookletSerializer(BookletRetrieveSerializer):

    subHeader = serializers.CharField(source='sub_header', allow_blank=True, default='', label='Untertitel', help_text="Das ist der Untertitel für das Titelblatt")
    mainHeader = serializers.CharField(source='main_header', allow_blank=True, default='', label='Hauptitel', help_text='Das ist der Haupttitel für das Titelblatt')

    class Meta(BookletRetrieveSerializer.Meta):
        fields = ("id", "references", "format", "header", "subHeader", "mainHeader", "status", "booklet")

    def validate_references(self, value):
        invalid_codes = set()
        for code in value:
            try:
                reference = Reference.get_reference(code)
                if reference.deprecated:
                    invalid_codes.add(code)
            except Reference.DoesNotExist:
                invalid_codes.add(code)
        if invalid_codes:
            n = len(invalid_codes)
            raise serializers.ValidationError(f"Reference{'s' if n>1 else ''} '{', '.join(invalid_codes)}' {'are' if n>1 else 'is'} not valid.")
        return value
