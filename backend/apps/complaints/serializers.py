from rest_framework import serializers

from apps.accounts.permissions import is_admin, is_manager

from .models import Complaint

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES // (1024 * 1024)

ALLOWED_IMAGE_TYPES = ("image/jpeg", "image/png")


class ComplaintSerializer(serializers.ModelSerializer):
    # Nama pelapor hanya dibutuhkan admin yang harus tahu laporan ini milik
    # siapa, dan hanya admin yang berhak melihat identitas pelapor. Dihitung di
    # serializer supaya field ini benar-benar tidak pernah terkirim ke role
    # lain, bukan sekadar disembunyikan di frontend.
    reporter_username = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = (
            "id",
            "reporter",
            "reporter_username",
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

    def get_reporter_username(self, obj):
        """Nama pelapor hanya untuk admin, selain itu null.

        Staf sengaja tidak ikut: tugasnya menangani laporan, bukan mencari tahu
        siapa yang melaporkannya.
        """
        request = self.context.get("request")

        if request is None or not is_admin(request.user):
            return None

        return obj.reporter.username

    def validate_image(self, image):
        if image is None:
            return image

        # content_type di sini BUKAN header yang dikirim client. Field ImageField
        # milik DRF meneruskan ke django.forms.ImageField, yang menimpanya dengan
        # Image.MIME.get(image.format) hasil decode Pillow
        # (django/forms/fields.py:754). Jadi allowlist di bawah menilai format
        # isi file yang benar-benar sudah dibaca Pillow, bukan nama ekstensi
        # atau klaim MIME dari client. File yang bukan gambar ditolak lebih
        # dulu di to_internal_value dengan pesan "Upload a valid image".
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

    # Dipetakan ke label Bahasa Indonesia supaya pesan error memakai istilah
    # yang sama dengan halaman lain.
    MANAGER_ONLY_FIELDS = {
        "status": "status",
        "priority": "prioritas",
    }

    def _current_value(self, field):
        """Nilai field yang tersimpan sekarang, termasuk saat belum ada objek.

        Saat create belum ada instance, jadi yang dibandingkan adalah default
        model. Tanpa ini mahasiswa yang mengirim status/prioritas default akan
        ditolak padahal tidak mengubah apa pun.
        """
        if self.instance is None:
            return Complaint._meta.get_field(field).get_default()

        return getattr(self.instance, field)

    def validate(self, attrs):
        """Tolak perubahan status dan priority dari selain pengelola.

        Dua field itu menentukan bagaimana pengaduan ditangani, jadi keduanya
        kewenangan staf dan admin. Tanpa guard ini pemilik bisa menandai
        pengaduannya sendiri sebagai RESOLVED tanpa pernah ditinjau siapa pun.
        Ownership di view hanya membatasi siapa yang boleh menyentuh objek,
        bukan field apa yang boleh diubah.
        """
        request = self.context.get("request")

        if request is not None and not is_manager(request.user):
            for field, label in self.MANAGER_ONLY_FIELDS.items():
                if field not in attrs:
                    continue

                # Mengirim nilai yang sama dengan yang sudah tersimpan bukan
                # perubahan, jadi PATCH yang tidak menyentuh field ini tidak
                # ikut ditolak.
                if self._current_value(field) != attrs[field]:
                    raise serializers.ValidationError({
                        field: [
                            f"Hanya pengelola yang dapat mengubah {label} "
                            f"pengaduan."
                        ]
                    })

        return attrs
