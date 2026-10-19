from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

User = get_user_model()

REGISTER_URL = "/api/auth/register/"
LOGIN_URL = "/api/auth/login/"
REFRESH_URL = "/api/auth/refresh/"
BLACKLIST_URL = "/api/auth/blacklist/"
ME_URL = "/api/auth/me/"


class RegisterTests(APITestCase):
    def test_weak_password_is_rejected(self):
        response = self.client.post(
            REGISTER_URL,
            {"username": "budi", "password": "1234"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_common_password_is_rejected(self):
        response = self.client.post(
            REGISTER_URL,
            {"username": "budi", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_strong_password_is_accepted(self):
        response = self.client.post(
            REGISTER_URL,
            {"username": "budi", "password": "Rumah-Kampus-7"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_password_too_similar_to_username_is_rejected(self):
        response = self.client.post(
            REGISTER_URL,
            {"username": "budiwijaya", "password": "budiwijaya99"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_new_user_is_forced_to_student_role(self):
        self.client.post(
            REGISTER_URL,
            {"username": "budi", "password": "Rumah-Kampus-7"},
            format="json",
        )

        self.assertEqual(User.objects.get(username="budi").role, User.Role.STUDENT)

    def test_client_cannot_register_itself_as_admin(self):
        response = self.client.post(
            REGISTER_URL,
            {
                "username": "penyerang",
                "password": "Rumah-Kampus-7",
                "role": "ADMIN",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            User.objects.get(username="penyerang").role, User.Role.STUDENT
        )


class AuthTokenLifecycleTests(APITestCase):
    """Siklus login -> refresh (rotasi) -> logout -> coba pakai ulang."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="budi", password="Rumah-Kampus-7", role=User.Role.STUDENT
        )

    def _login(self):
        response = self.client.post(
            LOGIN_URL,
            {"username": "budi", "password": "Rumah-Kampus-7"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        return response.data

    def test_login_returns_access_and_refresh(self):
        data = self._login()

        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_me_requires_authentication(self):
        response = self.client.get(ME_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotates_and_returns_new_refresh(self):
        original = self._login()["refresh"]

        response = self.client.post(
            REFRESH_URL, {"refresh": original}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        # Wajib ada karena ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION.
        # Frontend harus menyimpan refresh baru ini, kalau tidak user akan
        # kehilangan sesi pada refresh berikutnya.
        self.assertIn("refresh", response.data)
        self.assertNotEqual(response.data["refresh"], original)

    def test_old_refresh_is_rejected_after_rotation(self):
        original = self._login()["refresh"]

        rotated = self.client.post(
            REFRESH_URL, {"refresh": original}, format="json"
        )
        self.assertEqual(rotated.status_code, status.HTTP_200_OK)

        replay = self.client.post(
            REFRESH_URL, {"refresh": original}, format="json"
        )
        self.assertEqual(replay.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_blacklist_requires_authentication(self):
        data = self._login()

        response = self.client.post(
            BLACKLIST_URL, {"refresh": data["refresh"]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_refresh_so_it_cannot_be_reused(self):
        data = self._login()

        logout = self.client.post(
            BLACKLIST_URL,
            {"refresh": data["refresh"]},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {data['access']}",
        )
        self.assertEqual(logout.status_code, status.HTTP_200_OK)

        reuse = self.client.post(
            REFRESH_URL, {"refresh": data["refresh"]}, format="json"
        )
        self.assertEqual(reuse.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_blacklist_does_not_leak_token_contents(self):
        data = self._login()

        response = self.client.post(
            BLACKLIST_URL,
            {"refresh": data["refresh"]},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {data['access']}",
        )

        self.assertEqual(response.data, {})


class MeViewTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="siti", password="Rumah-Kampus-7", role=User.Role.STAFF
        )
        self.client.force_authenticate(self.user)

    def test_me_returns_current_user_without_password(self):
        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "siti")
        self.assertEqual(response.data["role"], User.Role.STAFF)
        self.assertNotIn("password", response.data)


class CreateSuperUserRoleTests(TestCase):
    def test_create_superuser_defaults_to_admin_role(self):
        """createsuperuser tidak boleh menyisakan role=STUDENT.

        Otorisasi API hanya membaca field `role`, jadi superuser yang role-nya
        masih STUDENT akan berperilaku seperti mahasiswa meski punya akses penuh
        ke /admin/ Django.
        """
        user = User.objects.create_superuser(
            username="root", password="Rumah-Kampus-7"
        )

        self.assertTrue(user.is_superuser)
        self.assertEqual(user.role, User.Role.ADMIN)
