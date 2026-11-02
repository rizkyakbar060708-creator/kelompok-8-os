import io
import os
import tempfile
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from apps.facilities.models import Facility

from .models import Complaint

User = get_user_model()

# Media upload tidak boleh menulis ke media/ repo saat test berjalan.
MEDIA_ROOT = tempfile.mkdtemp(prefix="complaints-test-media-")


def image_bytes(fmt="PNG", size=(8, 8)):
    """File gambar asli supaya bisa di-decode Pillow."""
    buffer = io.BytesIO()
    Image.new("RGB", size, (220, 40, 40)).save(buffer, format=fmt)

    return buffer.getvalue()


def png_in_size_range(low=5.1 * 1024 * 1024, high=5.8 * 1024 * 1024):
    """PNG acak yang ukurannya sengaja antara 5 MB dan batas 6 MB.

    Isian pixel diambil dari os.urandom supaya isinya incompressible. Kalau
    pixelnya berupa pola yang dapat ditebak, PNG akan memampatkan file ini
    menjadi berukuran sangat kecil dan batas ukuran jadi tidak pernah
    benar-benar teruji.

    Ukuran akhir dicek ulang setelah dikompresi, lalu sisi gambar dikecilkan
    atau diperbesar sedikit sampai masuk rentang yang dikehendaki. Rentang
    5-6 MB penting: di atas 6 MB request sudah ditolak Django dengan
    RequestDataTooBig sebelum pernah sampai ke validate_image.
    """
    edge = 1600

    for _ in range(40):
        buffer = io.BytesIO()
        Image.frombytes(
            "RGB", (edge, edge), os.urandom(edge * edge * 3)
        ).save(buffer, format="PNG")

        size = buffer.tell()

        if low <= size <= high:
            return buffer.getvalue()

        edge = int(edge * 0.97) if size > high else int(edge * 1.03)

    raise AssertionError("Tidak bisa membuat PNG pada rentang ukuran yang diminta")


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.list_url = "/api/complaints/"

        self.student = User.objects.create_user(
            username="student_a", password="Passw0rd!aaa", role=User.Role.STUDENT
        )
        self.other_student = User.objects.create_user(
            username="student_b", password="Passw0rd!aaa", role=User.Role.STUDENT
        )
        self.staff = User.objects.create_user(
            username="staff_a", password="Passw0rd!aaa", role=User.Role.STAFF
        )
        self.admin = User.objects.create_user(
            username="admin_a", password="Passw0rd!aaa", role=User.Role.ADMIN
        )

        self.facility = self._create_facility()
        self.own = self._create_complaint(self.student)
        self.foreign = self._create_complaint(self.other_student)

    def _create_facility(self):
        return Facility.objects.create(
            name="AC Ruang 301",
            location="Gedung A - Lantai 3",
        )

    def _create_complaint(self, reporter):
        return Complaint.objects.create(
            reporter=reporter,
            facility=self.facility,
            title="AC rusak",
            description="Tidak dingin sejak kemarin.",
        )

    def detail_url(self, complaint):
        return f"/api/complaints/{complaint.id}/"

    def _ids(self, response):
        return {item["id"] for item in response.data}

    # --- list -------------------------------------------------------------

    def test_anonymous_cannot_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_list_only_contains_own_complaints(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._ids(response), {self.own.id})
        self.assertNotIn(self.foreign.id, self._ids(response))

    def test_admin_list_contains_all_complaints(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._ids(response), {self.own.id, self.foreign.id})

    def test_staff_list_contains_all_complaints(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._ids(response), {self.own.id, self.foreign.id})

    # --- detail read ------------------------------------------------------

    def test_anonymous_cannot_read_detail(self):
        response = self.client.get(self.detail_url(self.own))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_can_read_own_detail(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.detail_url(self.own))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.own.id)

    def test_student_cannot_read_other_complaint(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.detail_url(self.foreign))

        # 404, bukan 403: scoping di queryset membuat objek ini tidak pernah
        # terlihat, sehingga id milik orang lain tidak bisa diprobe.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_read_any_detail(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.detail_url(self.foreign))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.foreign.id)

    # --- update / delete --------------------------------------------------

    def test_student_can_update_own_complaint(self):
        self.client.force_authenticate(self.student)
        response = self.client.patch(
            self.detail_url(self.own),
            {"title": "AC ruang 301 mati total"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.own.refresh_from_db()
        self.assertEqual(self.own.title, "AC ruang 301 mati total")

    def test_student_cannot_update_other_complaint(self):
        original_title = self.foreign.title
        self.client.force_authenticate(self.student)
        response = self.client.patch(
            self.detail_url(self.foreign),
            {"title": "dibajak"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.foreign.refresh_from_db()
        self.assertEqual(self.foreign.title, original_title)

    def test_student_cannot_delete_other_complaint(self):
        self.client.force_authenticate(self.student)
        response = self.client.delete(self.detail_url(self.foreign))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Complaint.objects.filter(pk=self.foreign.pk).exists())

    def test_anonymous_cannot_delete(self):
        response = self.client.delete(self.detail_url(self.own))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_a", password="Passw0rd!aaa", role=User.Role.STUDENT
        )
        self.victim = User.objects.create_user(
            username="student_b", password="Passw0rd!aaa", role=User.Role.STUDENT
        )
        self.facility = self._facility()
        self.payload = {
            "facility": self.facility.id,
            "title": "Lampu koridor mati",
            "description": "Gelap sejak malam.",
        }

    def _facility(self):
        return Facility.objects.create(
            name="Lampu Koridor", location="Gedung B - Lantai 1"
        )

    def test_reporter_is_taken_from_token_not_payload(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            "/api/complaints/",
            {**self.payload, "reporter": self.victim.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        complaint = Complaint.objects.get(id=response.data["id"])
        self.assertEqual(complaint.reporter_id, self.student.id)
        self.assertNotEqual(complaint.reporter_id, self.victim.id)

    def test_anonymous_cannot_create(self):
        response = self.client.post(
            "/api/complaints/", self.payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_cannot_set_status_on_create(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            "/api/complaints/",
            {**self.payload, "status": "RESOLVED"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_student_cannot_set_priority_on_create(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            "/api/complaints/",
            {**self.payload, "priority": "HIGH"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("priority", response.data)

    def test_student_sending_default_values_on_create_is_accepted(self):
        """Nilai default model bukan perubahan, jadi tidak boleh ditolak.

        Bandingannya memakai default model, bukan `None` dari instance yang
        belum ada. Tanpa itu form yang mengirim status/prioritas default akan
        ditolak padahal hasilnya sama persis dengan tidak mengirimnya.
        """
        self.client.force_authenticate(self.student)
        response = self.client.post(
            "/api/complaints/",
            {
                **self.payload,
                "status": Complaint.Status.PENDING,
                "priority": Complaint.Priority.MEDIUM,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintStatusPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_a", password="Passw0rd!aaa", role=User.Role.STUDENT
        )
        self.staff = User.objects.create_user(
            username="staff_a", password="Passw0rd!aaa", role=User.Role.STAFF
        )
        self.admin = User.objects.create_user(
            username="admin_a", password="Passw0rd!aaa", role=User.Role.ADMIN
        )

        facility = Facility.objects.create(
            name="Pintu Lab", location="Gedung C - Lantai 2"
        )
        self.complaint = Complaint.objects.create(
            reporter=self.student,
            facility=facility,
            title="Pintu lab tidak terkunci",
            description="Bisa masuk tanpa kartu.",
        )
        self.url = f"/api/complaints/{self.complaint.id}/"

    def test_student_cannot_change_own_status(self):
        self.client.force_authenticate(self.student)
        response = self.client.patch(
            self.url, {"status": "RESOLVED"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, Complaint.Status.PENDING)

    def test_student_cannot_change_own_priority(self):
        self.client.force_authenticate(self.student)
        response = self.client.patch(
            self.url, {"priority": "HIGH"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.priority, Complaint.Priority.MEDIUM)

    def test_student_patching_unrelated_field_still_works(self):
        self.client.force_authenticate(self.student)
        response = self.client.patch(
            self.url, {"description": "Perlu diperbaiki segera."}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.description, "Perlu diperbaiki segera.")

    def test_resending_same_status_is_not_treated_as_change(self):
        self.client.force_authenticate(self.student)
        response = self.client.patch(
            self.url,
            {"status": Complaint.Status.PENDING},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_change_status(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            self.url, {"status": "RESOLVED"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, Complaint.Status.RESOLVED)

    def test_admin_can_change_priority(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            self.url, {"priority": "HIGH"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.priority, Complaint.Priority.HIGH)

    def test_staff_can_change_status(self):
        self.client.force_authenticate(self.staff)
        response = self.client.patch(
            self.url, {"status": "IN_PROGRESS"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, Complaint.Status.IN_PROGRESS)


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintDeletePermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_a", password="Passw0rd!aaa", role=User.Role.STUDENT
        )
        self.staff = User.objects.create_user(
            username="staff_a", password="Passw0rd!aaa", role=User.Role.STAFF
        )
        self.admin = User.objects.create_user(
            username="admin_a", password="Passw0rd!aaa", role=User.Role.ADMIN
        )

        facility = Facility.objects.create(
            name="Pintu Lab", location="Gedung C - Lantai 2"
        )
        self.pending = Complaint.objects.create(
            reporter=self.student,
            facility=facility,
            title="Pintu lab tidak terkunci",
            description="Bisa masuk tanpa kartu.",
        )
        self.resolved = Complaint.objects.create(
            reporter=self.student,
            facility=facility,
            title="Lampu koridor mati",
            description="Gelap sejak malam.",
            status=Complaint.Status.RESOLVED,
        )

    def url(self, complaint):
        return f"/api/complaints/{complaint.id}/"

    def test_student_can_delete_own_pending_complaint(self):
        self.client.force_authenticate(self.student)
        response = self.client.delete(self.url(self.pending))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Complaint.objects.filter(pk=self.pending.pk).exists())

    def test_student_cannot_delete_own_resolved_complaint(self):
        self.client.force_authenticate(self.student)
        response = self.client.delete(self.url(self.resolved))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Complaint.objects.filter(pk=self.resolved.pk).exists())

    def test_staff_cannot_delete_complaint(self):
        self.client.force_authenticate(self.staff)
        response = self.client.delete(self.url(self.pending))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Complaint.objects.filter(pk=self.pending.pk).exists())

    def test_admin_can_delete_any_complaint(self):
        self.client.force_authenticate(self.admin)
        response = self.client.delete(self.url(self.resolved))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Complaint.objects.filter(pk=self.resolved.pk).exists())


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintReporterVisibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_a", password="Passw0rd!aaa", role=User.Role.STUDENT
        )
        self.staff = User.objects.create_user(
            username="staff_a", password="Passw0rd!aaa", role=User.Role.STAFF
        )
        self.admin = User.objects.create_user(
            username="admin_a", password="Passw0rd!aaa", role=User.Role.ADMIN
        )

        facility = Facility.objects.create(
            name="Meja Rusak", location="Gedung D - Lantai 1"
        )
        self.complaint = Complaint.objects.create(
            reporter=self.student,
            facility=facility,
            title="Kaki meja patah",
            description="Sudah goyah sejak minggu lalu.",
        )
        self.url = f"/api/complaints/{self.complaint.id}/"

    def test_admin_sees_reporter_username(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reporter_username"], "student_a")

    def test_student_does_not_see_reporter_username(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["reporter_username"])

    def test_staff_sees_complaint_without_reporter_username(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["reporter_username"])


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintSuperuserRoleTests(TestCase):
    """Superuser tidak memberi hak apa pun di aplikasi.

    `is_superuser` hanya mengatur akses ke situs admin Django. Kalau ikut
    dihitung sebagai admin, akun yang berlabel STUDENT akan melihat seluruh
    pengaduan orang lain beserta nama pelapornya, persis seperti yang terjadi
    pada akun yang dibuat lewat createsuperuser sebelum role diisi manual.
    """

    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_a", password="Passw0rd!aaa", role=User.Role.STUDENT
        )
        self.super_student = User.objects.create_superuser(
            username="root", password="Passw0rd!aaa"
        )
        # Skenario yang pernah terjadi di database: superuser yang role-nya
        # masih STUDENT karena diisi manual sebelum manager diperbaiki.
        self.super_student.role = User.Role.STUDENT
        self.super_student.save(update_fields=["role"])

        facility = Facility.objects.create(
            name="Pintu Lab", location="Gedung C - Lantai 2"
        )
        self.own = Complaint.objects.create(
            reporter=self.super_student,
            facility=facility,
            title="Kaki meja labs patah",
            description="Sudah goyah sejak minggu lalu.",
        )
        self.foreign = Complaint.objects.create(
            reporter=self.student,
            facility=facility,
            title="Pintu lab tidak terkunci",
            description="Bisa masuk tanpa kartu.",
        )

    def test_superuser_with_student_role_only_sees_own_complaints(self):
        self.client.force_authenticate(self.super_student)
        response = self.client.get("/api/complaints/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual({item["id"] for item in response.data}, {self.own.id})

    def test_superuser_with_student_role_cannot_read_foreign_complaint(self):
        self.client.force_authenticate(self.super_student)
        response = self.client.get(f"/api/complaints/{self.foreign.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_superuser_with_student_role_does_not_see_reporter_username(self):
        self.client.force_authenticate(self.super_student)
        response = self.client.get(f"/api/complaints/{self.own.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["reporter_username"])


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintImageUploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_a", password="Passw0rd!aaa", role=User.Role.STUDENT
        )

        self.facility = Facility.objects.create(
            name="Meja Rusak", location="Gedung D - Lantai 1"
        )
        self.payload = {
            "facility": self.facility.id,
            "title": "Kaki meja patah",
            "description": "Sudah goyah sejak minggu lalu.",
        }

    def _upload(self, file_obj):
        self.client.force_authenticate(self.student)

        return self.client.post(
            "/api/complaints/", {**self.payload, "image": file_obj}
        )

    def test_valid_png_is_accepted_and_returned_as_media_path(self):
        upload = SimpleUploadedFile(
            "meja.png", image_bytes(), content_type="image/png"
        )
        response = self._upload(upload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        complaint = Complaint.objects.get(id=response.data["id"])
        self.assertTrue(complaint.image.name.startswith("complaints/"))

    def test_client_declared_mime_cannot_override_real_content(self):
        """Klaim MIME dari client tidak dipakai untuk memutuskan apa pun.

        Isinya PNG asli tapi dikirim seolah-olah image/gif. Pillow membaca
        format dari isi file, jadi content_type menjadi image/png dan upload
        diterima. Allowlist menilai isi, bukan klaim client.
        """
        upload = SimpleUploadedFile(
            "meja.png", image_bytes(), content_type="image/gif"
        )
        response = self._upload(upload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_real_image_in_disallowed_format_is_rejected(self):
        # BMP benar-benar gambar yang bisa di-decode Pillow, tapi di luar
        # ALLOWED_IMAGE_TYPES, jadi ditolak validate_image.
        upload = SimpleUploadedFile(
            "meja.png", image_bytes(fmt="BMP"), content_type="image/png"
        )
        response = self._upload(upload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)
        self.assertIn("PNG atau JPEG", " ".join(response.data["image"]))

    def test_non_image_content_is_rejected(self):
        upload = SimpleUploadedFile(
            "meja.png", b"ini bukan gambar sama sekali", content_type="image/png"
        )
        response = self._upload(upload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)

    def test_oversized_image_is_rejected(self):
        upload = SimpleUploadedFile(
            "besar.png", png_in_size_range(), content_type="image/png"
        )
        response = self._upload(upload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)
        self.assertIn("maksimal 5 MB", " ".join(response.data["image"]))

    def test_image_above_request_limit_is_still_rejected(self):
        """File di atas DATA_UPLOAD_MAX_MEMORY_SIZE (6 MB).

        Request ditolak Django dengan RequestDataTooBig sebelum mencapai
        serializer. Tetap harus 400, walau pesannya tidak menyebut batas 5 MB.
        """
        upload = SimpleUploadedFile(
            "sangatbesar.png",
            png_in_size_range(low=7 * 1024 * 1024, high=8 * 1024 * 1024),
            content_type="image/png",
        )
        response = self._upload(upload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintCategoryValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_category",
            password="Passw0rd!aaa",
            role=User.Role.STUDENT,
        )
        self.facility = Facility.objects.create(
            name="Proyektor Ruang 201", location="Gedung A - Lantai 2"
        )
        self.url = "/api/complaints/"

    def payload(self, **overrides):
        return {
            "title": "Laporan baru",
            "description": "Rincian laporan untuk pengujian.",
            **overrides,
        }

    def post(self, payload):
        self.client.force_authenticate(self.student)
        return self.client.post(self.url, payload, format="json")

    def test_facility_is_required_only_for_facility_category(self):
        response = self.post(self.payload(category="FASILITAS"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facility", response.data)

        response = self.post(
            self.payload(
                category="AKADEMIK",
                sub_category="JADWAL_KULIAH",
            )
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data["facility"])

    def test_non_facility_category_rejects_facility(self):
        response = self.post(
            self.payload(
                category="KEAMANAN",
                sub_category="PENCURIAN",
                facility=self.facility.id,
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facility", response.data)

    def test_non_facility_category_requires_sub_category_on_create(self):
        for category in ("AKADEMIK", "KEAMANAN"):
            response = self.post(self.payload(category=category))

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("sub_category", response.data)

    def test_legacy_complaint_can_be_patched_without_sub_category(self):
        # Pengaduan yang dibuat sebelum sub-kategori ada memiliki nilai kosong;
        # selama field itu tidak dikirim ulang, update lainnya tetap valid.
        complaint = Complaint.objects.create(
            reporter=self.student,
            category=Complaint.Category.KEAMANAN,
            title="Laporan lama",
            description="Dibuat sebelum sub-kategori diwajibkan.",
        )

        self.client.force_authenticate(self.student)
        response = self.client.patch(
            f"/api/complaints/{complaint.id}/",
            {"description": "Isi diperbarui."},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["sub_category"], "")

    def test_categories_endpoint_lists_sub_categories_per_category(self):
        self.client.force_authenticate(self.student)
        response = self.client.get("/api/complaints/categories/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        by_value = {item["value"]: item for item in response.data}

        self.assertEqual(by_value["FASILITAS"]["sub_categories"], [])
        self.assertIn(
            "JADWAL_KULIAH",
            [item["value"] for item in by_value["AKADEMIK"]["sub_categories"]],
        )
        self.assertEqual(
            by_value["AKADEMIK"]["sub_categories"][0]["label"], "Jadwal kuliah"
        )

    def test_legacy_complaint_without_category_defaults_to_fasilitas(self):
        # Pengaduan yang dibuat sebelum kolom category ada otomatis menjadi
        # FASILITAS lewat default model, bukan lewat backfill manual.
        complaint = Complaint.objects.create(
            reporter=self.student,
            facility=self.facility,
            title="Pengaduan lama",
            description="Dibuat sebelum kategori ditambahkan.",
        )

        self.assertEqual(complaint.category, Complaint.Category.FASILITAS)

        self.client.force_authenticate(self.student)
        response = self.client.get(f"/api/complaints/{complaint.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["category"], "FASILITAS")
        self.assertEqual(response.data["facility"], self.facility.id)

    def test_facility_category_requires_empty_sub_category(self):
        response = self.post(
            self.payload(
                category="FASILITAS",
                facility=self.facility.id,
                sub_category="PENCURIAN",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sub_category", response.data)

    def test_sub_category_must_match_its_category(self):
        response = self.post(
            self.payload(
                category="AKADEMIK",
                sub_category="PENCURIAN",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sub_category", response.data)

    def test_incident_date_cannot_be_in_the_future(self):
        response = self.post(
            self.payload(
                category="AKADEMIK",
                sub_category="JADWAL_KULIAH",
                incident_date=(timezone.now() + timedelta(minutes=1)).isoformat(),
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("incident_date", response.data)

    def test_security_sub_categories_get_high_priority_automatically(self):
        for sub_category in ("PENCURIAN", "PELECEHAN_PERUNDUNGAN"):
            response = self.post(
                self.payload(
                    category="KEAMANAN",
                    sub_category=sub_category,
                )
            )

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data["priority"], Complaint.Priority.HIGH)

    def test_sensitive_sub_categories_reject_image_when_created(self):
        self.client.force_authenticate(self.student)

        for sub_category in ("PENCURIAN", "PELECEHAN_PERUNDUNGAN"):
            response = self.client.post(
                self.url,
                {
                    **self.payload(
                        category="KEAMANAN",
                        sub_category=sub_category,
                    ),
                    "image": SimpleUploadedFile(
                        "bukti.png", image_bytes(), content_type="image/png"
                    ),
                },
                format="multipart",
            )

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("image", response.data)


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintCategoryAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_sensitive",
            password="Passw0rd!aaa",
            role=User.Role.STUDENT,
        )
        self.other_student = User.objects.create_user(
            username="student_filter",
            password="Passw0rd!aaa",
            role=User.Role.STUDENT,
        )
        self.staff = User.objects.create_user(
            username="staff_sensitive",
            password="Passw0rd!aaa",
            role=User.Role.STAFF,
        )
        self.admin = User.objects.create_user(
            username="admin_sensitive",
            password="Passw0rd!aaa",
            role=User.Role.ADMIN,
        )
        self.facility = Facility.objects.create(
            name="Pintu Gedung B", location="Gedung B - Lantai 1"
        )

    def create_complaint(self, reporter, **overrides):
        values = {
            "reporter": reporter,
            "title": "Laporan keamanan",
            "description": "Rincian laporan untuk pengujian.",
            "category": Complaint.Category.KEAMANAN,
            "sub_category": Complaint.SubCategory.PENCURIAN,
        }
        values.update(overrides)
        return Complaint.objects.create(**values)

    def ids(self, response):
        return {item["id"] for item in response.data}

    def test_staff_cannot_reveal_sensitive_reports_through_filters(self):
        sensitive = self.create_complaint(
            self.student,
            sub_category=Complaint.SubCategory.PELECEHAN_PERUNDUNGAN,
        )
        theft = self.create_complaint(self.other_student)
        self.client.force_authenticate(self.staff)

        category_response = self.client.get(
            "/api/complaints/", {"category": Complaint.Category.KEAMANAN}
        )
        sub_category_response = self.client.get(
            "/api/complaints/",
            {"sub_category": Complaint.SubCategory.PELECEHAN_PERUNDUNGAN},
        )

        self.assertEqual(category_response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.ids(category_response), {theft.id})
        self.assertNotIn(sensitive.id, self.ids(category_response))
        self.assertEqual(sub_category_response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.ids(sub_category_response), set())

    def test_student_filter_cannot_reveal_another_students_report(self):
        own = self.create_complaint(self.student)
        foreign = self.create_complaint(self.other_student)
        self.client.force_authenticate(self.student)

        response = self.client.get(
            "/api/complaints/",
            {"sub_category": Complaint.SubCategory.PENCURIAN},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.ids(response), {own.id})
        self.assertNotIn(foreign.id, self.ids(response))

    def test_staff_can_see_theft_reports_in_list_and_detail(self):
        theft = self.create_complaint(self.other_student)
        forced = self.create_complaint(
            self.student,
            sub_category=Complaint.SubCategory.PELECEHAN_PERUNDUNGAN,
        )
        self.client.force_authenticate(self.staff)

        list_response = self.client.get("/api/complaints/")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertIn(theft.id, self.ids(list_response))
        # Sensitif: helper create_complaint default-nya memang PENCURIAN.
        self.assertNotIn(forced.id, self.ids(list_response))

        detail_response = self.client.get(f"/api/complaints/{theft.id}/")

        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            detail_response.data["sub_category"], Complaint.SubCategory.PENCURIAN
        )

    def test_sensitive_report_is_only_available_to_reporter_and_admin(self):
        complaint = self.create_complaint(
            self.student,
            sub_category=Complaint.SubCategory.PELECEHAN_PERUNDUNGAN,
        )
        url = f"/api/complaints/{complaint.id}/"

        self.client.force_authenticate(self.staff)
        self.assertEqual(
            self.client.get(url).status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)

    def test_anonymous_report_hides_reporter_from_staff_but_not_owner_or_admin(self):
        complaint = Complaint.objects.create(
            reporter=self.student,
            facility=self.facility,
            title="Lampu koridor mati",
            description="Sudah gelap sejak sore.",
            is_anonymous=True,
        )
        url = f"/api/complaints/{complaint.id}/"

        self.client.force_authenticate(self.staff)
        staff_response = self.client.get(url)
        self.assertIsNone(staff_response.data["reporter"])
        self.assertIsNone(staff_response.data["reporter_username"])

        self.client.force_authenticate(self.student)
        owner_response = self.client.get(url)
        self.assertEqual(owner_response.data["reporter"], self.student.id)
        self.assertEqual(owner_response.data["reporter_username"], self.student.username)

        self.client.force_authenticate(self.admin)
        admin_response = self.client.get(url)
        self.assertEqual(admin_response.data["reporter"], self.student.id)
        self.assertEqual(admin_response.data["reporter_username"], self.student.username)


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintImmutableCategoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_immutable",
            password="Passw0rd!aaa",
            role=User.Role.STUDENT,
        )
        self.admin = User.objects.create_user(
            username="admin_immutable",
            password="Passw0rd!aaa",
            role=User.Role.ADMIN,
        )
        self.complaint = Complaint.objects.create(
            reporter=self.student,
            title="KRS belum terbuka",
            description="Perlu diperiksa.",
            category=Complaint.Category.AKADEMIK,
            sub_category=Complaint.SubCategory.KENDALA_KRS,
        )
        self.url = f"/api/complaints/{self.complaint.id}/"

    def test_category_fields_are_read_only_after_create_for_every_role(self):
        updates = {
            "category": Complaint.Category.KEAMANAN,
            "sub_category": Complaint.SubCategory.PENCURIAN,
            "is_anonymous": True,
        }

        for user in (self.student, self.admin):
            self.client.force_authenticate(user)
            for field, value in updates.items():
                response = self.client.patch(self.url, {field: value}, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.category, Complaint.Category.AKADEMIK)
        self.assertEqual(self.complaint.sub_category, Complaint.SubCategory.KENDALA_KRS)
        self.assertFalse(self.complaint.is_anonymous)

    def test_sensitive_report_rejects_image_on_patch_and_put(self):
        for sub_category in (
            Complaint.SubCategory.PENCURIAN,
            Complaint.SubCategory.PELECEHAN_PERUNDUNGAN,
        ):
            complaint = Complaint.objects.create(
                reporter=self.student,
                title="Laporan sensitif",
                description="Rincian laporan sensitif.",
                category=Complaint.Category.KEAMANAN,
                sub_category=sub_category,
            )
            url = f"/api/complaints/{complaint.id}/"
            self.client.force_authenticate(self.student)

            patch_response = self.client.patch(
                url,
                {
                    "image": SimpleUploadedFile(
                        "patch.png", image_bytes(), content_type="image/png"
                    )
                },
                format="multipart",
            )
            put_response = self.client.put(
                url,
                {
                    "title": complaint.title,
                    "description": complaint.description,
                    "image": SimpleUploadedFile(
                        "put.png", image_bytes(), content_type="image/png"
                    ),
                },
                format="multipart",
            )

            self.assertEqual(patch_response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("image", patch_response.data)
            self.assertEqual(put_response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("image", put_response.data)
