from django.conf import settings
from django.db import models

from apps.facilities.models import Facility


class Complaint(models.Model):
    class Category(models.TextChoices):
        FASILITAS = "FASILITAS", "Fasilitas"
        AKADEMIK = "AKADEMIK", "Akademik"
        KEAMANAN = "KEAMANAN", "Keamanan"

    class SubCategory(models.TextChoices):
        JADWAL_KULIAH = "JADWAL_KULIAH", "Jadwal kuliah"
        DOSEN_TIDAK_HADIR = "DOSEN_TIDAK_HADIR", "Dosen tidak hadir"
        KESALAHAN_NILAI = "KESALAHAN_NILAI", "Kesalahan nilai"
        KENDALA_KRS = "KENDALA_KRS", "Kendala KRS"
        PELAYANAN_AKADEMIK = "PELAYANAN_AKADEMIK", "Pelayanan akademik"
        KEHILANGAN_BARANG = "KEHILANGAN_BARANG", "Kehilangan barang"
        MASALAH_PARKIR = "MASALAH_PARKIR", "Masalah parkir"
        PENCURIAN = "PENCURIAN", "Pencurian"
        GANGGUAN_KEAMANAN = "GANGGUAN_KEAMANAN", "Gangguan keamanan"
        PELECEHAN_PERUNDUNGAN = (
            "PELECEHAN_PERUNDUNGAN",
            "Pelecehan atau perundungan",
        )

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"
        REJECTED = "REJECTED", "Rejected"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaints",
    )

    facility = models.ForeignKey(
        Facility,
        on_delete=models.CASCADE,
        related_name="complaints",
        blank=True,
        null=True,
    )

    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.FASILITAS,
    )

    sub_category = models.CharField(
        max_length=30,
        choices=SubCategory.choices,
        blank=True,
        default="",
    )

    title = models.CharField(max_length=200)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    image = models.ImageField(
        upload_to="complaints/",
        blank=True,
        null=True,
    )

    incident_location = models.CharField(max_length=255, blank=True)
    incident_date = models.DateTimeField(blank=True, null=True)
    is_anonymous = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @classmethod
    def sub_categories_for(cls, category):
        if category == cls.Category.AKADEMIK:
            return (
                cls.SubCategory.JADWAL_KULIAH,
                cls.SubCategory.DOSEN_TIDAK_HADIR,
                cls.SubCategory.KESALAHAN_NILAI,
                cls.SubCategory.KENDALA_KRS,
                cls.SubCategory.PELAYANAN_AKADEMIK,
            )

        if category == cls.Category.KEAMANAN:
            return (
                cls.SubCategory.KEHILANGAN_BARANG,
                cls.SubCategory.MASALAH_PARKIR,
                cls.SubCategory.PENCURIAN,
                cls.SubCategory.GANGGUAN_KEAMANAN,
                cls.SubCategory.PELECEHAN_PERUNDUNGAN,
            )

        return ()

    @property
    def is_sensitive(self):
        return self.sub_category == self.SubCategory.PELECEHAN_PERUNDUNGAN
