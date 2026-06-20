import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "first_name", "last_name"]

    def validate_username(self, value):
        if not (6 <= len(value) <= 12):
            raise serializers.ValidationError("Login ID must be between 6 and 12 characters.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_password(self, value):
        if len(value) <= 8:
            raise serializers.ValidationError("Password must be more than 8 characters long.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[\W_]', value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        # Ensure new users are standard users
        validated_data["is_staff"] = False
        validated_data["is_superuser"] = False
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "is_superuser"]
        read_only_fields = fields


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get("username") or attrs.get("email") or attrs.get(User.USERNAME_FIELD)
        password = attrs.get("password")
        user = User.objects.filter(username__iexact=identifier).first()
        if user is None:
            user = User.objects.filter(email__iexact=identifier).first()
        if user is None or not user.check_password(password):
            raise AuthenticationFailed("Unable to log in with provided credentials.")
        if not user.is_active:
            raise AuthenticationFailed("User account is disabled.")
        refresh = RefreshToken.for_user(user)
        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "success": True,
            "user": UserSerializer(user).data,
        }
        return data


class LoginAPIView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class RegisterAPIView(APIView):
    schema = None
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "success": True,
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeAPIView(APIView):
    schema = None
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"success": True, "user": UserSerializer(request.user).data})


class LogoutAPIView(APIView):
    schema = None
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"success": False, "message": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"success": True, "message": "Logged out successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"success": False, "message": f"Logout failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
