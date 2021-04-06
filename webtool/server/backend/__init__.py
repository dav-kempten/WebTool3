# -*- coding: utf-8 -*-

from django.contrib.auth.backends import ModelBackend

from server.models import Profile, Tour, Instruction, Session, Talk


class Backend(ModelBackend):

    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            profile = Profile.objects.get(member_id=kwargs.get('member_id'))
        except Profile.DoesNotExist:
            return None
        except Profile.MultipleObjectsReturned:
            return None

        user = profile.user
        return user

    def get_all_permissions(self, user_obj, obj=None):

        if not user_obj.is_active or user_obj.is_anonymous():
            return set()

        if not hasattr(user_obj, '_perm_cache'):
            user_obj._perm_cache = self.get_user_permissions(user_obj)
            user_obj._perm_cache.update(self.get_group_permissions(user_obj))

        if obj:
            if isinstance(obj, Tour):
                user_is_owner = obj.guide.user_id == user_obj.id
                if not user_is_owner:
                    return user_obj._perm_cache - {'server.change_tour'}
            elif isinstance(obj, Instruction):
                user_is_owner = obj.guide.user_id == user_obj.id
                if not user_is_owner:
                    return user_obj._perm_cache - {'server.change_instruction'}
            elif isinstance(obj, Session):
                user_is_owner = (
                    obj.guide.user_id == user_obj.id or
                    obj.collective.managers.filter(user_id=user_obj.id).exists()
                )
                if not user_is_owner:
                    return user_obj._perm_cache - {'server.change_session'}
            else:
                return set()

        return user_obj._perm_cache

    def has_perm(self, user_obj, perm, obj=None):

        if user_obj.is_superuser:
            return True

        if user_obj.is_staff and (
            isinstance(obj, Tour) or
            isinstance(obj, Instruction) or
            isinstance(obj, Session) or
            isinstance(obj, Talk)
        ):
            return True

        return super(Backend, self).has_perm(user_obj, perm, obj)
