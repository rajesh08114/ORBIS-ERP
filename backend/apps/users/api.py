from django.contrib.auth.models import Group, Permission
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "content_type"]


class GroupSerializer(serializers.ModelSerializer):
    permissions_details = PermissionSerializer(source="permissions", many=True, read_only=True)
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        required=False,
    )

    class Meta:
        model = Group
        fields = ["id", "name", "permissions", "permissions_details"]

    def create(self, validated_data):
        permissions = validated_data.pop("permissions", [])
        group = Group.objects.create(**validated_data)
        group.permissions.set(permissions)
        return group

    def update(self, instance, validated_data):
        permissions = validated_data.pop("permissions", None)
        instance.name = validated_data.get("name", instance.name)
        instance.save()
        if permissions is not None:
            instance.permissions.set(permissions)
        return instance


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.select_related("content_type").all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAdminUser]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related("permissions").all()
    serializer_class = GroupSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=["post"])
    def assign_permissions(self, request, pk=None):
        group = self.get_object()
        permission_ids = request.data.get("permissions", [])
        if not isinstance(permission_ids, list):
            return Response(
                {"success": False, "message": "Permissions must be a list of IDs."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            permissions = Permission.objects.filter(id__in=permission_ids)
            group.permissions.set(permissions)
            return Response({"success": True, "message": "Permissions assigned successfully."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
