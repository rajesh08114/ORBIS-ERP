from apps.common.models import UserProfile as CommonUserProfile


class UserProfile(CommonUserProfile):
    class Meta:
        proxy = True
        verbose_name = "user profile"
        verbose_name_plural = "user profiles"
