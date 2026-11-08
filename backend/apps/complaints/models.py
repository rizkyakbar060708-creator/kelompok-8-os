from django.conf import settings
from django.db import models
from django.utils import timezone

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

    # Terisi otomatis saat status berubah ke RESOLVED, dikosongkan lagi kalau
    # pengaduan dibuka kembali. Dasar perhitungan rata-rata waktu penyelesaian.
    resolved_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # resolved_at mengikuti status, bukan diisi manual: begitu status keluar
        # dari RESOLVED (mis. dibuka kembali) stempel waktunya tidak boleh
        # tertinggal, supaya agregasi rata-rata penyelesaian tidak menghitung
        # pengaduan yang sebenarnya masih terbuka.
        if self.status == self.Status.RESOLVED:
            if self.resolved_at is None:
                self.resolved_at = timezone.now()
        elif self.resolved_at is not None:
            self.resolved_at = None

        super().save(*args, **kwargs)

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


class Appeal(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DENIED = "DENIED", "Denied"

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="appeals",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="appeals",
    )
    reason = models.TextField()
    evidence = models.ImageField(
        upload_to="appeals/",
        blank=True,
        null=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="reviewed_appeals",
    )
    response_note = models.TextField(blank=True, default="")
    reviewed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["complaint"],
                condition=models.Q(status="PENDING"),
                name="unique_pending_appeal_per_complaint",
            )
        ]

    def __str__(self):
        return f"Appeal #{self.id} for Complaint #{self.complaint_id} ({self.status})"
