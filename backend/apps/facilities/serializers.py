from rest_framework import serializers

from .models import Facility


class FacilitySerializer(serializers.ModelSerializer):

    class Meta:
        model = Facility

        fields = (
            "id",
            "name",
            "description",
            "location",
            "status",
            "created_at",
            "updated_at",
        )

        extra_kwargs = {
            "id": {
                "read_only": True,
            },
            "name": {
                "required": True,
                "allow_blank": False,
            },
            "description": {
                "required": False,
                "allow_blank": True,
            },
            "location": {
                "required": True,
                "allow_blank": False,
            },
            "status": {
                "required": False,
            },
            "created_at": {
                "read_only": True,
            },
            "updated_at": {
                "read_only": True,
            },
        }