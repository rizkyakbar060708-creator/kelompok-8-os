from rest_framework import serializers

from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = (
            "id",
            "reporter",
            "facility",
            "title",
            "description",
            "status",
            "priority",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "id": {
                "read_only": True,
            },
            "reporter": {
                "required": True,
            },
            "facility": {
                "required": True,
            },
            "title": {
                "required": True,
                "allow_blank": False,
            },
            "description": {
                "required": True,
                "allow_blank": False,
            },
            "status": {
                "required": False,
            },
            "priority": {
                "required": False,
            },
            "created_at": {
                "read_only": True,
            },
            "updated_at": {
                "read_only": True,
            },
        }