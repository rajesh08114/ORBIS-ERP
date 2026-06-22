from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from apps.common.profile_services import ensure_profile_bundle


ROLE_PERMISSIONS = {
    "Admin": ["*"],
    "Sales User": [
        "partners.view_customer",
        "partners.add_customer",
        "partners.change_customer",
        "partners.delete_customer",
        "products.view_product",
        "sales.view_salesorder",
        "sales.add_salesorder",
        "sales.change_salesorder",
    ],
    "Purchase User": [
        "partners.view_vendor",
        "partners.add_vendor",
        "partners.change_vendor",
        "partners.delete_vendor",
        "products.view_product",
        "purchases.view_purchaseorder",
        "purchases.add_purchaseorder",
        "purchases.change_purchaseorder",
    ],
    "Manufacturing User": [
        "products.view_product",
        "manufacturing.view_billofmaterial",
        "manufacturing.add_billofmaterial",
        "manufacturing.change_billofmaterial",
        "manufacturing.view_manufacturingorder",
        "manufacturing.add_manufacturingorder",
        "manufacturing.change_manufacturingorder",
        "manufacturing.view_workcenter",
        "manufacturing.view_operation",
        "manufacturing.view_workorder",
        "manufacturing.change_workorder",
    ],
    "Inventory Manager": [
        "products.view_product",
        "inventory.view_stockmovement",
        "inventory.change_stockmovement",
    ],
    "Business Owner": [
        "common.view_dashboard",
        "partners.view_customer",
        "partners.view_vendor",
        "products.view_product",
        "sales.view_salesorder",
        "purchases.view_purchaseorder",
        "manufacturing.view_billofmaterial",
        "manufacturing.view_manufacturingorder",
        "inventory.view_stockmovement",
        "audit.view_auditlog",
        "audit.view_auditentry",
    ],
}


def _permission_from_string(permission_path: str) -> Permission | None:
    app_label, codename = permission_path.split(".", 1)
    return Permission.objects.filter(content_type__app_label=app_label, codename=codename).first()


@receiver(post_migrate)
def ensure_erp_groups(sender, **kwargs):
    if sender.label not in {
        "auth",
        "admin",
        "partners",
        "products",
        "sales",
        "purchases",
        "manufacturing",
        "inventory",
        "audit",
        "common",
    }:
        return

    # Migration mappings for old legacy roles to the new strict list
    role_migrations = {
        "Administrator": "Admin",
        "Sales Manager": "Sales User",
        "Procurement Manager": "Purchase User",
        "Manufacturing Manager": "Manufacturing User",
        "System User": "Admin",
    }

    for old_role, new_role in role_migrations.items():
        old_group = Group.objects.filter(name=old_role).first()
        if old_group:
            new_group, _ = Group.objects.get_or_create(name=new_role)
            for user in old_group.user_set.all():
                user.groups.add(new_group)
                user.groups.remove(old_group)
                if hasattr(user, "erp_profile") and user.erp_profile.role_title == old_role:
                    user.erp_profile.role_title = new_role
                    user.erp_profile.save(update_fields=["role_title"])
            old_group.delete()

    for role_name, permissions in ROLE_PERMISSIONS.items():
        group, _ = Group.objects.get_or_create(name=role_name)
        if permissions == ["*"]:
            group.permissions.set(Permission.objects.all())
            continue

        resolved = []
        for permission_path in permissions:
            permission = _permission_from_string(permission_path)
            if permission:
                resolved.append(permission)
        group.permissions.set(resolved)

    # Clean up any groups that are not in ROLE_PERMISSIONS
    valid_roles = set(ROLE_PERMISSIONS.keys())
    for group in Group.objects.all():
        if group.name not in valid_roles:
            group.delete()


from django.contrib.auth import get_user_model
from django.db.models.signals import post_save


@receiver(post_save, sender=get_user_model())
def create_or_update_user_profile(sender, instance, created, **kwargs) -> None:
    common_profile, _ = ensure_profile_bundle(instance)
    if created:
        common_profile.save()
        return
    if hasattr(instance, "erp_profile"):
        instance.erp_profile.save()
