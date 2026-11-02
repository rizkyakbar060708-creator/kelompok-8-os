from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsManagerOrOwner, is_admin, is_manager

from .models import Complaint
from .permissions import CanDeleteComplaint
from .serializers import ComplaintSerializer


class ComplaintCategoriesView(APIView):
    """Return list of complaint categories for dropdown."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Setiap kategori membawa sub-kategorinya sehingga frontend bisa
        # membangun dropdown bertingkat tanpa konstanta terpisah.
        categories = [
            {
                "value": choice[0],
                "label": choice[1],
                "sub_categories": [
                    # Member TextChoices adalah str, jadi sub[0] akan
                    # menghasilkan karakter bukan value; pakai .value/.label.
                    {"value": sub.value, "label": sub.label}
                    for sub in Complaint.sub_categories_for(choice[0])
                ],
            }
            for choice in Complaint.Category.choices
        ]
        return Response(categories)


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

        if is_admin(self.request.user):
            scoped_queryset = queryset
        elif is_manager(self.request.user):
            # Laporan pelecehan/perundungan tidak masuk antrean staf umum.
            # Filter ini dipasang sebelum query parameter agar staf tidak
            # dapat memunculkannya kembali lewat URL filter.
            scoped_queryset = queryset.exclude(
                sub_category=Complaint.SubCategory.PELECEHAN_PERUNDUNGAN
            )
        else:
            scoped_queryset = queryset.filter(reporter=self.request.user)

        for field in ("category", "sub_category", "status", "priority"):
            value = self.request.query_params.get(field)
            if value:
                scoped_queryset = scoped_queryset.filter(**{field: value})

        return scoped_queryset


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
