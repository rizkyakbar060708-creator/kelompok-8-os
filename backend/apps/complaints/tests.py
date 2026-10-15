import io
import os
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
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


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ComplaintStatusPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="student_a", password="Passw0rd!aaa", role=User.Role.STUDENT
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
