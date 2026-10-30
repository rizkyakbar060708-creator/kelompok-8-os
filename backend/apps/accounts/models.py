from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as DjangoUserManager
from django.db import models


class UserManager(DjangoUserManager):
    use_in_migrations = False

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        # Tanpa ini, createsuperuser menghasilkan akun dengan role=STUDENT
        # padahal is_superuser=True. Otorisasi di API sengaja hanya membaca
        # field `role`, jadi akun seperti itu akan tampil sebagai mahasiswa dan
        # tidak bisa mengelola apa pun.
        extra_fields.setdefault("role", User.Role.ADMIN)

        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        STAFF = "STAFF", "Staff"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    objects = UserManager()