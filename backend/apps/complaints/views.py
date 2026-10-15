from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsOwnerOrAdmin, is_admin
from .models import Complaint
from .serializers import ComplaintSerializer


class ScopedComplaintMixin:
    """Batasi queryset ke pengaduan milik user yang sedang login.

    Scoping di level queryset, bukan hanya lewat object permission. Object
    permission hanya dijalankan untuk objek yang lolos get_object(), sehingga
    endpoint list sama sekali tidak terlindungi kalau queryset tidak di-filter.
    """

    def get_queryset(self):
        queryset = super().get_queryset()

        if is_admin(self.request.user):
            return queryset

        return queryset.filter(reporter=self.request.user)


class ComplaintListCreateView(ScopedComplaintMixin, generics.ListCreateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    # reporter tidak pernah diambil dari payload client, selalu dari session.
    # Field-nya read-only di serializer, jadi ini satu-satunya sumber identitas
    # pelapor.
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class ComplaintDetailView(
    ScopedComplaintMixin,
    generics.RetrieveUpdateDestroyAPIView,
):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
