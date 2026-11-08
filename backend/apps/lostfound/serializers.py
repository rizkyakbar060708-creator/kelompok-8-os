from rest_framework import serializers

from apps.accounts.permissions import is_manager

from .models import LostFoundItem


class LostFoundSerializer(serializers.ModelSerializer):
    reporter = serializers.ReadOnlyField(source="reporter_id")
    reporter_name = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = LostFoundItem
        fields = (
            "id",
            "type",
            "title",
            "description",
            "location",
            "date",
            "contact",
            "status",
            "reporter",
            "reporter_name",
            "can_edit",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "id": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
            "contact": {"required": False, "allow_blank": True},
            "status": {"required": False},
        }

    def get_reporter_name(self, obj) -> str:
        # Menampilkan username pelapor agar civitas lain mengetahui siapa yang melaporkan
        return obj.reporter.username if obj.reporter else ""

    def get_can_edit(self, obj) -> bool:
        # Memberitahu frontend apakah tombol aksi edit/hapus perlu diaktifkan untuk user ini
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        return is_manager(request.user) or obj.reporter_id == request.user.id

    def validate(self, attrs):
        # Saat pembuatan baru, status selalu dipaksa OPEN sesuai kontrak API
        if self.instance is None:
            attrs["status"] = LostFoundItem.Status.OPEN
            if "contact" not in attrs:
                attrs["contact"] = ""
        else:
            # Sesuai kontrak, tipe laporan (LOST/FOUND) tidak boleh diubah setelah dibuat
            if "type" in attrs and attrs["type"] != self.instance.type:
                raise serializers.ValidationError({
                    "type": "Tipe laporan tidak dapat diubah setelah dibuat."
                })

        return attrs
