from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.forms.models import model_to_dict

from apps.common.models import UserProfile as CommonUserProfile
from apps.users.models import UserProfile as AccountUserProfile

User = get_user_model()


def ensure_profile_bundle(user: User) -> tuple[CommonUserProfile, AccountUserProfile]:
    common_profile, _ = CommonUserProfile.objects.get_or_create(user=user)
    account_profile, _ = AccountUserProfile.objects.get_or_create(user=user)
    return common_profile, account_profile


def get_unified_profile(user: User) -> dict[str, Any]:
    common_profile, account_profile = ensure_profile_bundle(user)
    
    # Determine the role from the user's groups
    role = "System User"
    user_groups = [g.name for g in user.groups.all()]
    for r in ["Administrator", "Sales User", "Purchase User", "Manufacturing User", "Inventory Manager", "Business Owner"]:
        if r in user_groups:
            role = r
            break
    if user.is_superuser or user.is_staff:
        role = "Administrator"

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "role": role,
        },
        "common_profile": model_to_dict(
            common_profile,
            fields=["role_title", "mobile", "address", "position", "avatar_url", "avatar_public_id", "status"],
        ),
        "account_profile": model_to_dict(
            account_profile,
            fields=["status"],
        ),
        "groups": list(user.groups.values("id", "name")),
        "permissions": list(user.get_all_permissions()),
    }


def update_unified_profile(user: User, data: dict[str, Any]) -> dict[str, Any]:
    common_profile, account_profile = ensure_profile_bundle(user)

    user_fields = ["username", "email", "first_name", "last_name"]
    for field in user_fields:
        if field in data and data[field] is not None:
            setattr(user, field, data[field])

    if "status" in data and data["status"] is not None:
        status = str(data["status"])
        common_profile.status = status
        account_profile.status = status
        user.is_active = status == CommonUserProfile.STATUS_ACTIVE

    if "mobile" in data and data["mobile"] is not None:
        common_profile.mobile = data["mobile"]
    if "address" in data and data["address"] is not None:
        common_profile.address = data["address"]
    if "position" in data and data["position"] is not None:
        common_profile.position = data["position"]
    if "role_title" in data and data["role_title"] is not None:
        common_profile.role_title = data["role_title"]
    if "avatar_url" in data and data["avatar_url"] is not None:
        common_profile.avatar_url = data["avatar_url"]
    if "avatar_public_id" in data and data["avatar_public_id"] is not None:
        common_profile.avatar_public_id = data["avatar_public_id"]
        
    if "role" in data and data["role"] is not None:
        role_name = data["role"]
        # Remove from other ERP groups first
        erp_groups = ["Sales User", "Purchase User", "Manufacturing User", "Inventory Manager", "Business Owner"]
        for gname in erp_groups:
            group = Group.objects.filter(name=gname).first()
            if group:
                user.groups.remove(group)
        # Add to the new group
        new_group = Group.objects.filter(name=role_name).first()
        if new_group:
            user.groups.add(new_group)

    user.save()
    common_profile.save()
    return get_unified_profile(user)


def set_avatar(user: User, *, avatar_url: str, avatar_public_id: str = "") -> dict[str, Any]:
    return update_unified_profile(
        user,
        {
            "avatar_url": avatar_url,
            "avatar_public_id": avatar_public_id,
        },
    )
