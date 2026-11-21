import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import LostFoundItem

User = get_user_model()


class LostFoundAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.list_url = "/api/lost-found/"

        self.student_a = User.objects.create_user(
            username="student_a",
            password="Passw0rd!aaa",
            role=User.Role.STUDENT,
        )
        self.student_b = User.objects.create_user(
            username="student_b",
            password="Passw0rd!bbb",
            role=User.Role.STUDENT,
        )
        self.staff = User.objects.create_user(
            username="staff_a",
            password="Passw0rd!staff",
            role=User.Role.STAFF,
        )
        self.admin = User.objects.create_user(
            username="admin_a",
            password="Passw0rd!admin",
            role=User.Role.ADMIN,
        )

        self.item_a = LostFoundItem.objects.create(
            reporter=self.student_a,
            type=LostFoundItem.Type.LOST,
            title="Kunci Motor Honda",
            description="Gantungan kunci warna merah",
            location="Parkiran Gedung B",
            date=datetime.date(2026, 11, 1),
            contact="08123456789",
            status=LostFoundItem.Status.OPEN,
        )
        self.item_b = LostFoundItem.objects.create(
            reporter=self.student_b,
            type=LostFoundItem.Type.FOUND,
            title="Tumbler Biru",
            description="Tertinggal di meja depan",
            location="Perpustakaan Lt 2",
            date=datetime.date(2026, 11, 2),
            contact="",
            status=LostFoundItem.Status.RESOLVED,
        )

    def detail_url(self, pk):
        return f"/api/lost-found/{pk}/"

    # --- Autentikasi ---

    def test_unauthenticated_cannot_access(self):
        # Seluruh endpoint Lost & Found wajib autentikasi JWT
        res_list = self.client.get(self.list_url)
        self.assertEqual(res_list.status_code, status.HTTP_401_UNAUTHORIZED)

        res_post = self.client.post(
            self.list_url,
            {
                "type": "LOST",
                "title": "Dompet Hitam",
                "description": "Hilang",
                "location": "Kantin",
                "date": "2026-11-03",
            },
        )
        self.assertEqual(res_post.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Create ---

    def test_create_success_and_reporter_automatic(self):
        # Create berhasil dan reporter otomatis diambil dari token login, bukan payload
        self.client.force_authenticate(user=self.student_a)

        payload = {
            "type": "LOST",
            "title": "Dompet Kulit Cokelat",
            "description": "Berisi kartu mahasiswa dan KTP",
            "location": "Kantin Utama",
            "date": "2026-11-04",
            "contact": "08987654321",
            "status": "RESOLVED",  # Sengaja kirim RESOLVED untuk verifikasi paksaan OPEN
            "reporter": 999,  # Sengaja kirim id lain untuk verifikasi pemaksaan user login
        }

        res = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        data = res.json()
        self.assertEqual(data["type"], "LOST")
        self.assertEqual(data["title"], "Dompet Kulit Cokelat")
        self.assertEqual(data["location"], "Kantin Utama")
        self.assertEqual(data["date"], "2026-11-04")
        self.assertEqual(data["contact"], "08987654321")
        # Status otomatis OPEN
        self.assertEqual(data["status"], "OPEN")
        # Reporter otomatis user login
        self.assertEqual(data["reporter"], self.student_a.id)
        self.assertEqual(data["reporter_name"], self.student_a.username)
        # can_edit bernilai true untuk pembuat laporan
        self.assertTrue(data["can_edit"])

    def test_create_contact_optional(self):
        # Field contact boleh kosong dan default ke string kosong
        self.client.force_authenticate(user=self.student_b)

        payload = {
            "type": "FOUND",
            "title": "Jaket Hitam",
            "description": "Ukuran L di kursi",
            "location": "Ruang 301",
            "date": "2026-11-05",
        }

        res = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()["contact"], "")

    # --- List & Filter ---

    def test_list_all_visible_without_scoping(self):
        # Berbeda dengan pengaduan fasilitas, semua civitas melihat semua item
        self.client.force_authenticate(user=self.student_a)
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        items = res.json()
        self.assertIsInstance(items, list)
        self.assertEqual(len(items), 2)
        # Urut created_at terbaru (item_b dibuat setelah item_a)
        self.assertEqual(items[0]["id"], self.item_b.id)
        self.assertEqual(items[1]["id"], self.item_a.id)

    def test_filter_by_type(self):
        self.client.force_authenticate(user=self.student_a)

        res_lost = self.client.get(self.list_url, {"type": "LOST"})
        self.assertEqual(len(res_lost.json()), 1)
        self.assertEqual(res_lost.json()[0]["id"], self.item_a.id)

        res_found = self.client.get(self.list_url, {"type": "FOUND"})
        self.assertEqual(len(res_found.json()), 1)
        self.assertEqual(res_found.json()[0]["id"], self.item_b.id)

    def test_filter_by_status(self):
        self.client.force_authenticate(user=self.student_a)

        res_open = self.client.get(self.list_url, {"status": "OPEN"})
        self.assertEqual(len(res_open.json()), 1)
        self.assertEqual(res_open.json()[0]["id"], self.item_a.id)

        res_resolved = self.client.get(self.list_url, {"status": "RESOLVED"})
        self.assertEqual(len(res_resolved.json()), 1)
        self.assertEqual(res_resolved.json()[0]["id"], self.item_b.id)

    def test_search_by_title_or_location(self):
        self.client.force_authenticate(user=self.student_a)

        # Cari berdasarkan judul
        res_search_title = self.client.get(self.list_url, {"search": "Kunci"})
        self.assertEqual(len(res_search_title.json()), 1)
        self.assertEqual(res_search_title.json()[0]["id"], self.item_a.id)

        # Cari berdasarkan lokasi
        res_search_loc = self.client.get(self.list_url, {"search": "Perpustakaan"})
        self.assertEqual(len(res_search_loc.json()), 1)
        self.assertEqual(res_search_loc.json()[0]["id"], self.item_b.id)

    # --- can_edit Flag ---

    def test_can_edit_flag_evaluations(self):
        # item_a dibuat oleh student_a
        # student_a melihat item_a -> can_edit True
        self.client.force_authenticate(user=self.student_a)
        res_a = self.client.get(self.detail_url(self.item_a.id))
        self.assertTrue(res_a.json()["can_edit"])

        # student_b melihat item_a -> can_edit False
        self.client.force_authenticate(user=self.student_b)
        res_b = self.client.get(self.detail_url(self.item_a.id))
        self.assertFalse(res_b.json()["can_edit"])

        # staff melihat item_a -> can_edit True
        self.client.force_authenticate(user=self.staff)
        res_staff = self.client.get(self.detail_url(self.item_a.id))
        self.assertTrue(res_staff.json()["can_edit"])

        # admin melihat item_a -> can_edit True
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get(self.detail_url(self.item_a.id))
        self.assertTrue(res_admin.json()["can_edit"])

    # --- PATCH Permissions & Constraints ---

    def test_other_user_cannot_patch(self):
        # User lain yang bukan pembuat dan bukan staff/admin mendapat 403
        self.client.force_authenticate(user=self.student_b)
        res = self.client.patch(
            self.detail_url(self.item_a.id),
            {"title": "Diubah orang lain"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_patch(self):
        # Pembuat laporan dapat mengubah data miliknya
        self.client.force_authenticate(user=self.student_a)
        res = self.client.patch(
            self.detail_url(self.item_a.id),
            {
                "title": "Kunci Motor Honda Beat",
                "status": "RESOLVED",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.item_a.refresh_from_db()
        self.assertEqual(self.item_a.title, "Kunci Motor Honda Beat")
        self.assertEqual(self.item_a.status, "RESOLVED")

    def test_admin_and_staff_can_patch(self):
        # Staff dan Admin dapat mengubah laporan siapa saja
        self.client.force_authenticate(user=self.staff)
        res_staff = self.client.patch(
            self.detail_url(self.item_a.id),
            {"status": "RESOLVED"},
            format="json",
        )
        self.assertEqual(res_staff.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.patch(
            self.detail_url(self.item_a.id),
            {"status": "OPEN"},
            format="json",
        )
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)

    def test_patch_type_immutable(self):
        # Tipe laporan tidak boleh diubah
        self.client.force_authenticate(user=self.student_a)
        res = self.client.patch(
            self.detail_url(self.item_a.id),
            {"type": "FOUND"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("type", res.json())

    def test_patch_reporter_immutable(self):
        # Reporter tidak dapat dipindahtangankan lewat PATCH
        self.client.force_authenticate(user=self.student_a)
        self.client.patch(
            self.detail_url(self.item_a.id),
            {"reporter": self.student_b.id},
            format="json",
        )
        self.item_a.refresh_from_db()
        self.assertEqual(self.item_a.reporter_id, self.student_a.id)

    # --- DELETE Permissions ---

    def test_other_user_cannot_delete(self):
        # User lain ditolak 403 saat menghapus item milik orang lain
        self.client.force_authenticate(user=self.student_b)
        res = self.client.delete(self.detail_url(self.item_a.id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(LostFoundItem.objects.filter(id=self.item_a.id).exists())

    def test_owner_can_delete(self):
        # Pembuat laporan dapat menghapus laporannya
        self.client.force_authenticate(user=self.student_a)
        res = self.client.delete(self.detail_url(self.item_a.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(LostFoundItem.objects.filter(id=self.item_a.id).exists())

    def test_staff_and_admin_can_delete(self):
        # Staff dan Admin dapat menghapus item apa pun
        item_c = LostFoundItem.objects.create(
            reporter=self.student_a,
            type=LostFoundItem.Type.LOST,
            title="Barang C",
            description="Desc",
            location="Loc",
            date=datetime.date(2026, 11, 1),
        )
        self.client.force_authenticate(user=self.staff)
        res_staff = self.client.delete(self.detail_url(item_c.id))
        self.assertEqual(res_staff.status_code, status.HTTP_204_NO_CONTENT)

        item_d = LostFoundItem.objects.create(
            reporter=self.student_a,
            type=LostFoundItem.Type.LOST,
            title="Barang D",
            description="Desc",
            location="Loc",
            date=datetime.date(2026, 11, 1),
        )
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.delete(self.detail_url(item_d.id))
        self.assertEqual(res_admin.status_code, status.HTTP_204_NO_CONTENT)
