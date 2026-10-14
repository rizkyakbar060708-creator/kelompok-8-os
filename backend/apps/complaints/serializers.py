from rest_framework import serializers

from .models import Complaint


MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES // (1024 * 1024)

ALLOWED_IMAGE_TYPES = ("image/jpeg", "image/png")


class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = (
            "id",
            "reporter",
            "facility",
            "title",
            "description",
            "status",
            "priority",
            "image",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "id": {
                "read_only": True,
            },
            # Identitas pelapor berasal dari access token, bukan dari payload.
            # Kalau field ini writable, client bisa mengarang reporter id.
            "reporter": {
                "read_only": True,
            },
            "facility": {
                "required": True,
            },
            "title": {
                "required": True,
                "allow_blank": False,
            },
            "description": {
                "required": True,
                "allow_blank": False,
            },
            "status": {
                "required": False,
            },
            "priority": {
                "required": False,
            },
            "image": {
                "required": False,
                "allow_null": True,
            },
            "created_at": {
                "read_only": True,
            },
            "updated_at": {
                "read_only": True,
            },
        }

    def validate_image(self, image):
        if image is None:
            return image

        # DATA_UPLOAD_MAX_MEMORY_SIZE (6 MB di settings) sengaja dibuat sedikit
        # lebih besar dari batas di sini, supaya request yang terlalu besar
        # tetap sampai ke validate_image dan mendapat pesan yang jelas, bukan
        # RequestDataTooBig yang errornya tidak menjelaskan batas file foto.
        # Batas sesungguhnya ditegakkan di method ini, bukan di settings.
        if image.size > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError(
                f"Ukuran foto maksimal {MAX_IMAGE_SIZE_MB} MB. "
                f"File yang dipilih berukuran "
                f"{image.size // (1024 * 1024)} MB."
            )

        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError(
                "Format foto harus PNG atau JPEG."
            )

        return image
