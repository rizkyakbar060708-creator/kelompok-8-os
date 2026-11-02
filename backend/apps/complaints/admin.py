from django.contrib import admin

from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "reporter",
        "facility",
        "category",
        "sub_category",
        "is_anonymous",
        "status",
        "priority",
        "created_at",
    )

    list_filter = ("category", "sub_category", "is_anonymous", "status", "priority")
    search_fields = ("title", "description")
