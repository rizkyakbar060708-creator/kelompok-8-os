from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsManagerOrOwner, is_manager

from .models import Complaint
from .permissions import CanDeleteComplaint
from .serializers import ComplaintSerializer


class ScopedComplaintMixin:
    """Batasi queryset ke pengaduan milik user yang sedang login.

    Scoping di level queryset, bukan hanya lewat object permission. Object
    permission hanya dijalankan untuk objek yang lolos get_object(), sehingga
    endpoint list sama sekali tidak terlindungi kalau queryset tidak di-filter.

    Staf dan admin tetap melihat seluruh pengaduan karena tugas mereka memang
    menindaklanjuti laporan orang lain.
    """

    def get_queryset(self):
        queryset = super().get_queryset()

        if is_manager(self.request.user):
            return queryset

        return queryset.filter(reporter=self.request.user)


class ComplaintListCreateView(ScopedComplaintMixin, generics.ListCreateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsManagerOrOwner]

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
    permission_classes = [
        IsAuthenticated,
        IsManagerOrOwner,
        CanDeleteComplaint,
    ]
