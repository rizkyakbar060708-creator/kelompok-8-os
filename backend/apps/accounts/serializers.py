from django.contrib.auth import get_user_model
from django.contrib.auth import password_validation
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
from django.db.models import Count
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "username",
            "password",
        ]

        extra_kwargs = {
            "password": {
                "write_only": True,
            },
        }

    def validate_password(self, value):
        # AUTH_PASSWORD_VALIDATORS di settings.py sudah mendaftarkan validator
        # bawaan Django, tapi ModelSerializer tidak memanggilnya sendiri.
        # Tanpa call eksplisit di sini password seperti "1234" tetap lolos.
        # User belum tersimpan, jadi instance kosong hanya dipakai validator
        # yang membandingkan password dengan atribut user (UserAttributeSimilarity).
        candidate = User(username=self.initial_data.get("username", ""))

        try:
            password_validation.validate_password(value, candidate)
        except DjangoValidationError as error:
            # Exception Django diterjemahkan ke ValidationError DRF supaya jadi
            # 400 pada field password, bukan 500 yang membocorkan stack trace.
            raise serializers.ValidationError(
                list(error.messages)
            ) from error

        return value

    def create(self, validated_data):
        # role dipaksa di sini, bukan dibaca dari payload. Field role tidak
        # ada di fields serializer, jadi client tidak bisa mendaftarkan diri
        # sebagai ADMIN.
        return User.objects.create_user(
            **validated_data,
            role=User.Role.STUDENT,
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "role",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer admin untuk manajemen pengguna.

    complaints_count dihitung di queryset lewat annotate(Count("complaints")),
    bukan query per baris. Semua field read-only kecuali role, dan password
    sengaja tidak pernah diekspos (tidak ada field password, tidak ada hash).
    """

    complaints_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "role",
            "is_active",
            "date_joined",
            "complaints_count",
        ]
        read_only_fields = [
            "id",
            "username",
            "is_active",
            "date_joined",
            "complaints_count",
        ]

    def validate_role(self, value):
        """Role harus salah satu dari User.Role; nilai lain ditolak 400."""
        if value not in dict(User.Role.choices):
            raise serializers.ValidationError("Role tidak valid.")

        return value


class AdminPasswordResetSerializer(serializers.Serializer):
    """Reset password oleh admin.

    Password hanya masuk sebagai input (write_only), tidak pernah dikembalikan
    atau disimpan dalam bentuk teks. Validasi pakai
    django.contrib.auth.password_validation.validate_password dengan instance
    user target supaya validator bawaan Django (termasuk similarity ke
    username) tetap berlaku. Simpan lewat set_password di view, bukan di sini.
    """

    password = serializers.CharField(write_only=True, required=True)

    def validate_password(self, value):
        target = self.context.get("user")

        if target is None:
            raise serializers.ValidationError("User target tidak diketahui.")

        try:
            password_validation.validate_password(value, user=target)
        except DjangoValidationError as error:
            raise serializers.ValidationError(
                {"password": list(error.messages)}
            ) from error

        return value
