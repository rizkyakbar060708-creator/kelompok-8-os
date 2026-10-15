from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

# Prefix wajib `apps.` karena app didaftarkan sebagai "apps.accounts" di
# INSTALLED_APPS. Import polos `accounts` tidak bisa di-resolve dan membuat
# seluruh urlconf gagal dimuat.
from apps.accounts.permissions import IsAdminOrReadOnly
from .models import Facility
from .serializers import FacilitySerializer


class FacilityListCreateView(generics.ListCreateAPIView):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class FacilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
