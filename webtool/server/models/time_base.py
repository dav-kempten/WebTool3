# -*- coding: utf-8 -*-
import hashlib
from datetime import datetime

from django.db.models.signals import post_save
from django.apps import apps
from django.core.cache import cache
from django.db import models

CACHE_KEY = 'wt3.object'


class ChangesManager(models.Manager):

    def changed_since(self, d=None):
        if d is None:
            d = datetime.min
        return self.get_queryset().filter(updated__gte=d)


class TimeMixin(models.Model):

    updated = models.DateTimeField(auto_now=True)
    deprecated = models.BooleanField(
        'Element gilt als gelöscht',
        blank=True, default=False
    )

    objects = ChangesManager()  # The default manager

    class Meta:
        abstract = True

    def get_etag_key(self):
        etag_key=get_etag_key(self._meta.model_name, self.pk)
        return etag_key

    def get_etag(self):
        etag = "{}.{}.{}.{}".format(CACHE_KEY, self._meta.model_name, self.pk, self.updated).encode()
        return hashlib.md5(etag).hexdigest()


def get_etag_key(name, pk):
    if not (name and pk):
        return None
    etag_key = "{}.{}.{}".format(CACHE_KEY, name, pk).encode()
    return hashlib.md5(etag_key).hexdigest()


def get_etag(name, pk):
    if not (name and pk):
        return None
    etag_key = get_etag_key(name, pk)
    etag = cache.get(etag_key)
    if etag is None:
        try:
            model = apps.get_model('server', name)
        except LookupError:
            return None
        try:
            etag = model.objects.get(pk=pk).get_etag()
        except model.DoesNotExist:
            return None
        cache.set(etag_key, etag, None)
    return etag


def post_save_receiver(sender, **kwargs):
    instance = kwargs.get('instance')
    if instance and hasattr(instance, 'get_etag_key') and hasattr(instance, 'get_etag'):
        etag_key = instance.get_etag_key()
        etag = instance.get_etag()
        cache.set(etag_key, etag, None)


post_save.connect(post_save_receiver, dispatch_uid="server.time_base.post_save_receiver")
