from django.contrib import admin

from .models import Appeal, Complaint


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


@admin.register(Appeal)
class AppealAdmin(admin.ModelAdmin):
    list_display = (
        "complaint",
        "submitted_by",
        "status",
        "reviewer",
        "reviewed_at",
        "created_at",
    )

    list_filter = ("status",)
    search_fields = ("reason", "response_note", "complaint__title")
