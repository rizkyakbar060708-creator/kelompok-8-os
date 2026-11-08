from django.utils import timezone
from rest_framework import serializers

from apps.accounts.permissions import is_admin, is_manager

from .models import Appeal, Complaint

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES // (1024 * 1024)

ALLOWED_IMAGE_TYPES = ("image/jpeg", "image/png")


class ComplaintSerializer(serializers.ModelSerializer):
    reporter = serializers.SerializerMethodField()
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
            "category",
            "sub_category",
            "title",
            "description",
            "status",
            "priority",
            "image",
            "incident_location",
            "incident_date",
            "is_anonymous",
            "resolved_at",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "id": {
                "read_only": True,
            },
            "facility": {
                "required": False,
                "allow_null": True,
            },
            "category": {
                "required": False,
            },
            "sub_category": {
                "required": False,
                "allow_blank": True,
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
            "incident_location": {
                "required": False,
                "allow_blank": True,
            },
            "incident_date": {
                "required": False,
                "allow_null": True,
            },
            "is_anonymous": {
                "required": False,
            },
            "resolved_at": {
                # Waktu penyelesaian dihitung model saat status berubah,
                # bukan dikirim client.
                "read_only": True,
            },
            "created_at": {
                "read_only": True,
            },
            "updated_at": {
                "read_only": True,
            },
        }

    IMMUTABLE_AFTER_CREATE_FIELDS = {
        "category": "kategori",
        "sub_category": "sub-kategori",
        "is_anonymous": "status anonim",
    }

    # PENCURIAN dan PELECEHAN_PERUNDUNGAN adalah dua sub-kategori sensitif:
    # keduanya otomatis HIGH saat dibuat, dan salah satunya (PELECEHAN)
    # juga disembunyikan dari STAFF. Foto dilarang untuk keduanya karena
    # media dilayani langsung di /media/ tanpa pemeriksaan permission.
    SENSITIVE_SUBCATEGORIES = frozenset({
        Complaint.SubCategory.PENCURIAN,
        Complaint.SubCategory.PELECEHAN_PERUNDUNGAN,
    })

    def get_reporter(self, obj):
        """Sembunyikan id pelapor dari staf saat laporan dibuat anonim."""
        request = self.context.get("request")

        if request is None:
            return obj.reporter_id

        if (
            obj.is_anonymous
            and not is_admin(request.user)
            and request.user.id != obj.reporter_id
        ):
            return None

        return obj.reporter_id

    def get_reporter_username(self, obj):
        """Nama pelapor hanya untuk admin, selain itu null.

        Staf sengaja tidak ikut: tugasnya menangani laporan, bukan mencari tahu
        siapa yang melaporkannya.
        """
        request = self.context.get("request")

        if request is None:
            return None

        if is_admin(request.user):
            return obj.reporter.username

        # Pelapor tetap dapat mengenali laporannya sendiri ketika memilih
        # pelaporan anonim; anonimitas ditujukan kepada staf, bukan dirinya.
        if obj.is_anonymous and request.user.id == obj.reporter_id:
            return obj.reporter.username

        return None

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

    def validate_incident_date(self, value):
        if value is not None and value > timezone.now():
            raise serializers.ValidationError(
                "Tanggal dan waktu kejadian tidak boleh di masa depan."
            )

        return value

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

        if self.instance is not None:
            for field, label in self.IMMUTABLE_AFTER_CREATE_FIELDS.items():
                # BooleanField pada multipart menganggap checkbox yang tidak
                # dikirim sebagai False. Periksa payload asli agar PUT untuk
                # mengganti gambar tidak keliru dianggap mengubah anonimitas.
                if field in self.initial_data:
                    raise serializers.ValidationError({
                        field: [f"{label.capitalize()} hanya dapat diisi saat membuat pengaduan."]
                    })

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

        category = attrs.get(
            "category",
            self.instance.category
            if self.instance is not None
            else Complaint.Category.FASILITAS,
        )
        sub_category = attrs.get(
            "sub_category",
            self.instance.sub_category if self.instance is not None else "",
        )
        facility = attrs.get(
            "facility",
            self.instance.facility if self.instance is not None else None,
        )
        errors = {}

        if category == Complaint.Category.FASILITAS:
            if facility is None:
                errors["facility"] = [
                    "Fasilitas wajib diisi untuk kategori FASILITAS."
                ]
            if sub_category:
                errors["sub_category"] = [
                    "Sub-kategori harus kosong untuk kategori FASILITAS."
                ]
        else:
            allowed_sub_categories = Complaint.sub_categories_for(category)
            if facility is not None:
                errors["facility"] = [
                    "Fasilitas hanya dapat diisi untuk kategori FASILITAS."
                ]
            if self.instance is None and not sub_category:
                # Sub-kategori baru diwajibkan; pengaduan lama yang dibuat
                # sebelum fitur ini boleh tetap tanpa sub-kategori selama
                # field itu tidak dikirim ulang pada update.
                errors["sub_category"] = [
                    "Sub-kategori wajib diisi untuk kategori ini."
                ]
            elif sub_category and sub_category not in allowed_sub_categories:
                errors["sub_category"] = [
                    "Sub-kategori tidak sesuai dengan kategori yang dipilih."
                ]

        if sub_category in self.SENSITIVE_SUBCATEGORIES:
            image = attrs.get("image")
            if image is not None:
                errors["image"] = [
                    "Foto tidak dapat diunggah untuk laporan pelecehan atau perundungan."
                ]

        if errors:
            raise serializers.ValidationError(errors)

        if (
            self.instance is None
            and sub_category in self.SENSITIVE_SUBCATEGORIES
        ):
            attrs["priority"] = Complaint.Priority.HIGH

        return attrs


class AppealSerializer(serializers.ModelSerializer):
    complaint = serializers.PrimaryKeyRelatedField(read_only=True)
    complaint_title = serializers.CharField(source="complaint.title", read_only=True)
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = Appeal
        fields = (
            "id",
            "complaint",
            "complaint_title",
            "status",
            "reason",
            "evidence",
            "response_note",
            "reviewer_name",
            "reviewed_at",
            "created_at",
        )
        read_only_fields = (
            "id",
            "complaint",
            "complaint_title",
            "status",
            "response_note",
            "reviewer_name",
            "reviewed_at",
            "created_at",
        )

    def get_reviewer_name(self, obj):
        if obj.reviewer is not None:
            return obj.reviewer.username
        return None


class AppealCreateSerializer(serializers.ModelSerializer):
    reason = serializers.CharField(required=True, allow_blank=False)
    evidence = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Appeal
        fields = (
            "reason",
            "evidence",
        )

    def validate_evidence(self, evidence):
        if evidence is None:
            return evidence

        if evidence.size > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError(
                f"Ukuran foto maksimal {MAX_IMAGE_SIZE_MB} MB. "
                f"File yang dipilih berukuran "
                f"{evidence.size // (1024 * 1024)} MB."
            )

        if evidence.content_type not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError(
                "Format foto harus PNG atau JPEG."
            )

        return evidence

    def validate(self, attrs):
        complaint = self.context.get("complaint")
        if complaint is None:
            raise serializers.ValidationError(
                {"detail": "Pengaduan tidak ditemukan."}
            )

        # 1. Hanya laporan REJECTED yang boleh dibanding.
        if complaint.status != Complaint.Status.REJECTED:
            raise serializers.ValidationError(
                {"detail": "Hanya laporan REJECTED yang boleh dibanding."}
            )

        # 3. Satu laporan hanya boleh punya satu banding PENDING dalam satu waktu.
        if Appeal.objects.filter(
            complaint=complaint, status=Appeal.Status.PENDING
        ).exists():
            raise serializers.ValidationError(
                {"detail": "Satu laporan hanya boleh punya satu banding PENDING dalam satu waktu."}
            )

        # 8. Foto dilarang untuk laporan PENCURIAN dan PELECEHAN_PERUNDUNGAN.
        if (
            complaint.sub_category in ComplaintSerializer.SENSITIVE_SUBCATEGORIES
            and attrs.get("evidence")
        ):
            raise serializers.ValidationError(
                {"evidence": ["Foto tidak dapat diunggah untuk laporan pencurian atau pelecehan/perundungan."]}
            )

        return attrs

    def create(self, validated_data):
        complaint = self.context["complaint"]
        request = self.context["request"]
        return Appeal.objects.create(
            complaint=complaint,
            submitted_by=request.user,
            reason=validated_data["reason"],
            evidence=validated_data.get("evidence"),
            status=Appeal.Status.PENDING,
        )

    def to_representation(self, instance):
        return AppealSerializer(instance, context=self.context).data


class AppealDecisionSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=[Appeal.Status.ACCEPTED, Appeal.Status.DENIED],
        required=True,
    )
    response_note = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    class Meta:
        model = Appeal
        fields = ("status", "response_note")

    def validate(self, attrs):
        if self.instance is not None and self.instance.status != Appeal.Status.PENDING:
            raise serializers.ValidationError(
                {"detail": "Keputusan hanya boleh diberikan pada banding yang masih PENDING."}
            )
        return attrs

    def update(self, instance, validated_data):
        request = self.context.get("request")
        new_status = validated_data["status"]
        response_note = validated_data.get("response_note", "")

        instance.status = new_status
        instance.response_note = response_note
        if request is not None and request.user.is_authenticated:
            instance.reviewer = request.user
        instance.reviewed_at = timezone.now()
        instance.save()

        # 5. Banding ACCEPTED: status laporan menjadi PENDING.
        if new_status == Appeal.Status.ACCEPTED:
            complaint = instance.complaint
            complaint.status = Complaint.Status.PENDING
            complaint.save()

        return instance

    def to_representation(self, instance):
        return AppealSerializer(instance, context=self.context).data
