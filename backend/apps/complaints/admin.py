from django.contrib import admin

from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "reporter",
        "facility",
        "status",
        "priority",
        "created_at",
    )

    list_filter = ("status", "priority")
    search_fields = ("title", "description")