from django.contrib.auth import get_user_model
from django.contrib.auth import password_validation
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
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
