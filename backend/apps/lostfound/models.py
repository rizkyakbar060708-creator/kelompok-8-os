from django.conf import settings
from django.db import models


class LostFoundItem(models.Model):
    """Model untuk pelaporan barang hilang dan penemuan barang.

    Fitur ini dipisahkan dari Complaint agar alur kerja pelaporan fasilitas kampus
    tidak bercampur dengan pencarian barang milik sivitas akademika.
    """

    class Type(models.TextChoices):
        LOST = "LOST", "Lost"
        FOUND = "FOUND", "Found"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        RESOLVED = "RESOLVED", "Resolved"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lost_found_items",
    )
    type = models.CharField(
        max_length=10,
        choices=Type.choices,
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=255)
    date = models.DateField()
    contact = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.OPEN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.type}] {self.title}"
