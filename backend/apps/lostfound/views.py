from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import LostFoundItem
from .permissions import IsOwnerOrManager
from .serializers import LostFoundSerializer


class LostFoundListCreateView(generics.ListCreateAPIView):
    """Endpoint untuk melihat daftar dan membuat laporan Lost & Found.

    Seluruh civitas yang terautentikasi dapat melihat seluruh laporan (tanpa scoping)
    dan membuat laporan baru. Reporter otomatis diisi dari user yang sedang login.
    """

    serializer_class = LostFoundSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # select_related("reporter") untuk mencegah N+1 query saat mengambil reporter_name dan reporter_id
        queryset = (
            LostFoundItem.objects.select_related("reporter")
            .order_by("-created_at")
        )

        item_type = self.request.query_params.get("type")
        if item_type:
            queryset = queryset.filter(type=item_type)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(location__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        # Reporter tidak diambil dari payload client melainkan sesi login demi integritas data
        serializer.save(
            reporter=self.request.user,
            status=LostFoundItem.Status.OPEN,
        )


class LostFoundDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Endpoint untuk melihat detail, memperbarui (PATCH), dan menghapus (DELETE) item.

    Hanya pemilik laporan atau staf/admin yang memiliki wewenang untuk mengubah atau menghapus.
    """

    queryset = LostFoundItem.objects.select_related("reporter")
    serializer_class = LostFoundSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrManager]
    http_method_names = ["get", "patch", "delete", "head", "options"]
