from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.common.profile_services import ensure_profile_bundle

User = get_user_model()


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs) -> None:
    common_profile, _ = ensure_profile_bundle(instance)
    if created:
        common_profile.save()
        return
    if hasattr(instance, "erp_profile"):
        instance.erp_profile.save()
