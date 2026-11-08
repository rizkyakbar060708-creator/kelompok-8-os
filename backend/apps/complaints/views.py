from datetime import timedelta

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import exceptions, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import (
    IsAdmin,
    IsManagerOrOwner,
    is_admin,
    is_manager,
)

from .models import Appeal, Complaint
from .permissions import CanDeleteComplaint
from .serializers import (
    AppealCreateSerializer,
    AppealDecisionSerializer,
    AppealSerializer,
    ComplaintSerializer,
)


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

    Root queryset diambil lewat base_queryset() supaya view agregasi (summary)
    bisa menyediakan queryset awalnya sendiri tanpa menimpa get_queryset()
    milik mixin — kalau get_queryset() ditimpa, seluruh scoping ikut hilang.
    """

    def base_queryset(self):
        # Dipanggil oleh subclass; untuk DRF generic view, super() akan
        # memberi self.queryset.
        return super().get_queryset()

    def get_queryset(self):
        queryset = self.base_queryset()

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

        # Pencarian teks: judul atau deskripsi, sesuai kebutuhan halaman
        # daftar dan antrean. icontains cukup untuk volume data pilot.
        search = self.request.query_params.get("search")
        if search:
            scoped_queryset = scoped_queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # Rentang tanggal mengikuti created_at. date_from inklusif mulai pukul
        # 00:00, date_to inklusif sampai akhir hari supaya ?date_to=2026-11-04
        # tetap memuat pengaduan yang dibuat hari itu.
        date_from = self.request.query_params.get("date_from")
        if date_from:
            parsed_from = parse_date(date_from)
            if parsed_from is None:
                raise exceptions.ValidationError(
                    {"date_from": "Format tanggal harus YYYY-MM-DD."}
                )
            scoped_queryset = scoped_queryset.filter(
                created_at__gte=parsed_from,
            )

        date_to = self.request.query_params.get("date_to")
        if date_to:
            parsed_to = parse_date(date_to)
            if parsed_to is None:
                raise exceptions.ValidationError(
                    {"date_to": "Format tanggal harus YYYY-MM-DD."}
                )
            # DatetimeField membandingkan pukul 00:00, jadi rentangnya maju
            # satu hari penuh untuk memasukkan seluruh isi tanggal itu.
            scoped_queryset = scoped_queryset.filter(
                created_at__lt=parsed_to + timedelta(days=1),
            )

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


class ComplaintSummaryView(ScopedComplaintMixin, APIView):
    """Ringkasan agregat untuk dashboard, di-scope role sama dengan list.

    Mahasiswa menerima agregat yang hanya menghitung pengaduannya sendiri,
    staf ringkasan seluruh kampus (dengan laporan pelecehan tetap
    disembunyikan, mengikuti mixin), admin seluruh kampus tanpa kecuali.
    Frontend tidak perlu menghitung ulang agregasi dari seluruh baris.
    """

    permission_classes = [IsAuthenticated]

    def base_queryset(self):
        return Complaint.objects.select_related("facility", "reporter")

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        scoped_rows = list(queryset.values(
            "id",
            "category",
            "sub_category",
            "status",
            "priority",
            "created_at",
            "resolved_at",
            "incident_location",
            "facility_id",
            "facility__name",
        ))

        # Aktivitas terbaru di-serialisasi penuh (bukan sekadar judul) supaya
        # panel samping frontend menikmati aturan yang sama dengan list:
        # reporter_username hanya untuk admin, reporter disembunyikan untuk
        # laporan anonim.
        recent_activity = ComplaintSerializer(
            queryset.order_by("-created_at")[:10],
            many=True,
            context={"request": request},
        )

        result = self._aggregate(scoped_rows)
        result["recent_activity"] = recent_activity.data
        return Response(result)

    # --- agregasi ----------------------------------------------------------
    def _aggregate(self, rows):
        all_categories = list(Complaint.Category.values)
        all_statuses = list(Complaint.Status.values)
        all_priorities = list(Complaint.Priority.values)

        total = len(rows)

        by_category = {key: 0 for key in all_categories}
        by_status = {key: 0 for key in all_statuses}
        by_priority = {key: 0 for key in all_priorities}
        by_status_per_category = {
            category: {key: 0 for key in all_statuses} for category in all_categories
        }

        # Aturan "mendesak" (dot merah sidebar) sengaja disinkronkan dengan
        # needsAttention di frontend/src/utils/complaintStats.ts — satu kalimat
        # untuk dua sisi: belum selesai (PENDING atau IN_PROGRESS) DAN
        # (prioritas HIGH ATAU umur lebih dari 3 hari). Angka urgent_by_category
        # di sini wajib identik dengan jumlah baris needsAttention per kategori
        # pada panel "Perlu perhatian"; mengubah aturan berarti mengubah kedua
        # sisi sekaligus.
        stale_cutoff = timezone.now() - timedelta(days=3)
        urgent_by_category = {key: 0 for key in all_categories}

        # Tren harian 30 hari terakhir: bucket dibuat nol terlebih dahulu
        # supaya tanggal kosong tidak melompat di chart frontend.
        today = timezone.localdate()
        day_offsets = range(29, -1, -1)
        bucket_dates = [today - timedelta(days=offset) for offset in day_offsets]
        by_day = {
            bucket: {category: 0 for category in all_categories}
            for bucket in bucket_dates
        }

        # Durasi penyelesaian per kategori, dalam jam.
        resolution_hours_per_category = {
            category: [] for category in all_categories
        }

        location_counts = {}

        for row in rows:
            category = row["category"]
            status = row["status"]
            priority = row["priority"]
            created_at = row["created_at"]

            by_category[category] = by_category.get(category, 0) + 1
            by_status[status] = by_status.get(status, 0) + 1
            by_priority[priority] = by_priority.get(priority, 0) + 1
            by_status_per_category.setdefault(
                category, {key: 0 for key in all_statuses}
            )[status] = by_status_per_category[category].get(status, 0) + 1

            still_open = status in (
                Complaint.Status.PENDING,
                Complaint.Status.IN_PROGRESS,
            )
            is_urgent = still_open and (
                priority == Complaint.Priority.HIGH
                or (created_at is not None and created_at < stale_cutoff)
            )
            if is_urgent:
                urgent_by_category[category] += 1

            if created_at is not None:
                day = timezone.localtime(created_at).date()

                if day in by_day:
                    by_day[day][category] = by_day[day].get(category, 0) + 1

            if row["resolved_at"] is not None and created_at is not None:
                elapsed_days = (
                    row["resolved_at"] - created_at
                ).total_seconds() / 3600
                resolution_hours_per_category.setdefault(
                    category, []
                ).append(elapsed_days)

            label = self._location_label(row)

            if label:
                bucket = location_counts.get(label["label"])
                if bucket is None:
                    bucket = dict(label)
                    bucket["count"] = 0
                    # Key-nya teks label, bukan dict, supaya agregasi aman.
                    location_counts[label["label"]] = bucket

                bucket["count"] += 1

        top_locations = sorted(
            location_counts.values(),
            key=lambda item: (-item["count"], item["label"]),
        )[:5]

        all_hours = [
            hours
            for hours in resolution_hours_per_category.values()
            for hours in hours
        ]

        avg_resolution_hours = {
            "overall": round(sum(all_hours) / len(all_hours), 1)
            if all_hours
            else None,
            "by_category": {
                category: round(sum(hours) / len(hours), 1) if hours else None
                for category, hours in resolution_hours_per_category.items()
            },
        }

        resolution_rate = {
            "overall": self._rate(by_status.get(Complaint.Status.RESOLVED, 0), total),
            "by_category": {
                category: self._rate(
                    by_status_per_category.get(category, {}).get(
                        Complaint.Status.RESOLVED, 0
                    ),
                    by_category.get(category, 0),
                )
                for category in all_categories
            },
        }

        trend_30d = [
            {
                "date": bucket.isoformat(),
                **by_day[bucket],
            }
            for bucket in bucket_dates
        ]

        return {
            "total": total,
            "by_category": by_category,
            "by_status": by_status,
            "by_status_per_category": by_status_per_category,
            "urgent_by_category": urgent_by_category,
            "by_priority": by_priority,
            "trend_30d": trend_30d,
            "top_locations": top_locations,
            "avg_resolution_hours": avg_resolution_hours,
            "resolution_rate": resolution_rate,
        }

    @staticmethod
    def _rate(resolved, total):
        if total == 0:
            return 0.0

        return round((resolved / total) * 100, 1)

    @staticmethod
    def _location_label(row):
        """Label top-lokasi: nama fasilitas, atau lokasi kejadian apabila
        pengaduan datang dari kategori yang tidak terkait fasilitas."""
        if row["facility_id"] is not None:
            return {"label": row["facility__name"] or "-", "kind": "facility"}

        text = (row["incident_location"] or row["sub_category"] or "").strip()

        if not text:
            return None

        return {"label": text, "kind": "location"}


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


class ComplaintAppealListCreateView(ScopedComplaintMixin, APIView):
    """Riwayat banding satu pengaduan (GET) dan pengajuan banding (POST).

    Identifikasi pengaduan tetap melalui hukum scoping pengaduan: mahasiswa
    melihat miliknya saja (id orang lain membalas 404), dan staf tidak pernah
    melihat PELECEHAN_PERUNDUNGAN. Berbeda dengan membaca, mengajukan banding
    hanya boleh dilakukan pemilik laporan — staf/admin yang kebetulan dapat
    membuka laporan itu tidak boleh mengajukan banding atas nama orang lain.
    """

    permission_classes = [IsAuthenticated]

    def base_queryset(self):
        return Complaint.objects.all()

    def get(self, request, pk):
        complaint = get_object_or_404(self.get_queryset(), pk=pk)

        serializer = AppealSerializer(
            complaint.appeals.all(),
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    def post(self, request, pk):
        complaint = get_object_or_404(self.get_queryset(), pk=pk)

        if complaint.reporter_id != request.user.id:
            return Response(
                {"detail": "Hanya pemilik laporan yang dapat mengajukan banding."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AppealCreateSerializer(
            data=request.data,
            context={"complaint": complaint, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AppealQueueView(generics.ListAPIView):
    """Antrean seluruh banding untuk diputuskan admin.

    Endpoint ini khusus ADMIN (bukan STAFF), berbeda dengan list pengaduan.
    Semua banding milik siapa pun tampil, jadi tidak perlu scoping tambahan.
    """

    queryset = Appeal.objects.select_related("complaint", "reviewer")
    serializer_class = AppealSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()

        filter_status = self.request.query_params.get("status")
        if filter_status:
            queryset = queryset.filter(status=filter_status)

        return queryset


class AppealDecisionView(generics.UpdateAPIView):
    """Keputusan atas banding (khusus ADMIN, hanya PATCH).

    Logika ACCEPTED/DENIED dan efeknya ke status pengaduan ada di
    AppealDecisionSerializer.update(), bukan di view, supaya pola yang sama
    dengan guard status/priority di ComplaintSerializer.
    """

    queryset = Appeal.objects.select_related("complaint", "reviewer")
    serializer_class = AppealDecisionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["patch"]
