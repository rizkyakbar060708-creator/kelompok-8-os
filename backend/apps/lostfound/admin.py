from django.contrib import admin

from .models import LostFoundItem


@admin.register(LostFoundItem)
class LostFoundItemAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "type",
        "status",
        "reporter",
        "location",
        "date",
        "created_at",
    )
    list_filter = ("type", "status", "date", "created_at")
    search_fields = ("title", "description", "location", "reporter__username")
