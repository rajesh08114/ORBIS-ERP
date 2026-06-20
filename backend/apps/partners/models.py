from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import TimeStampedModel


class PartnerQuerySet(models.QuerySet):
    def delete(self):
        count = super().update(is_active=False)
        return count, {self.model.__name__: count}


class ActivePartnerManager(models.Manager):
    def get_queryset(self):
        return PartnerQuerySet(self.model, using=self._db).filter(is_active=True)


class PartnerBase(TimeStampedModel):
    code_field_name = "code"

    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    objects = PartnerQuerySet.as_manager()
    active = ActivePartnerManager()

    class Meta:
        abstract = True

    def clean(self):
        if not self.name.strip():
            raise ValidationError({"name": "Name is required."})

    def delete(self, using=None, keep_parents=False):
        self.is_active = False
        self.save(update_fields=["is_active", "updated_at"])
        return 1, {self.__class__.__name__: 1}

    def undelete(self):
        self.is_active = True
        self.save(update_fields=["is_active", "updated_at"])


class Customer(PartnerBase):
    customer_code = models.CharField(max_length=64, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.customer_code} - {self.name}"


class Vendor(PartnerBase):
    vendor_code = models.CharField(max_length=64, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.vendor_code} - {self.name}"
