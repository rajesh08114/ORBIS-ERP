from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.audit.services import audit_update, log_audit_event

from apps.common.profile_services import ensure_profile_bundle, update_unified_profile
from apps.users.api import GroupSerializer
from apps.common.models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["role_title", "status"]


class UserAdminSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    groups_details = GroupSerializer(source="groups", many=True, read_only=True)
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False,
    )
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "is_active",
            "groups",
            "groups_details",
            "profile",
            "password",
        ]
        read_only_fields = ["id", "is_active", "groups_details"]

    def create(self, validated_data):
        profile_data = validated_data.pop("profile", {})
        groups = validated_data.pop("groups", [])
        password = validated_data.pop("password", None)

        status_val = profile_data.get("status", UserProfile.STATUS_ACTIVE)
        is_active = status_val == UserProfile.STATUS_ACTIVE

        user = User.objects.create(is_active=is_active, **validated_data)
        if password:
            user.set_password(password)
            user.save()
        user.groups.set(groups)

        update_unified_profile(
            user,
            {
                "role_title": profile_data.get("role_title", ""),
                "status": status_val,
            },
        )
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        groups = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)

        status_val = profile_data.get("status", None)
        if status_val is not None:
            instance.is_active = status_val == UserProfile.STATUS_ACTIVE

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()

        if groups is not None:
            instance.groups.set(groups)

        update_unified_profile(
            instance,
            {
                "role_title": profile_data.get("role_title", getattr(instance.erp_profile, "role_title", "")),
                "status": status_val if status_val is not None else getattr(instance.erp_profile, "status", UserProfile.STATUS_ACTIVE),
            },
        )
        return instance


class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("erp_profile").prefetch_related("groups").all()
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        # Exclude the current user to prevent self-lockouts
        return super().get_queryset().exclude(id=self.request.user.id)

    def perform_update(self, serializer):
        audit_update(self.get_object(), serializer, "User")

    @action(detail=True, methods=["post"])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        common_profile, _ = ensure_profile_bundle(user)

        if common_profile.status == UserProfile.STATUS_ACTIVE:
            common_profile.status = UserProfile.STATUS_INACTIVE
            user.is_active = False
        else:
            common_profile.status = UserProfile.STATUS_ACTIVE
            user.is_active = True

        common_profile.save()
        user.save()

        log_audit_event(
            entity_name="User",
            entity_id=str(user.id),
            action="toggled_status",
            details={"new_status": common_profile.status},
        )

        return Response({
            "success": True, 
            "status": common_profile.status, 
            "is_active": user.is_active,
            "message": f"User status changed to {common_profile.status}."
        })
