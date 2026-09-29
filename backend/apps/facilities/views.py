from rest_framework import generics

from .models import Facility
from .serializers import FacilitySerializer


class FacilityListCreateView(generics.ListCreateAPIView):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer

class FacilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    