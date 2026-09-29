from django.contrib import admin

from .models import Facility


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "location")