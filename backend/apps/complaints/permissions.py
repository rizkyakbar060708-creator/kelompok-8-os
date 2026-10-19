from rest_framework.permissions import BasePermission

from apps.accounts.permissions import is_admin

from .models import Complaint


class CanDeleteComplaint(BasePermission):
    """Hapus pengaduan hanya untuk admin, atau pemiliknya yang belum ditindaklanjuti.

    Staf sengaja ditolak supaya pengaduan yang sedang ditangani tidak hilang di
    tangan orang yang tidak membuat laporannya. Mahasiswa pun hanya boleh
    menarik laporannya selama masih PENDING; begitu sudah diproses atau
    disetujui, pengaduannya bukan lagi halamannya.

    Objek milik orang lain tidak pernah sampai ke sini karena queryset sudah
    di-scope, jadi yang bocor hanya "ada/tidak", bukan "boleh/tidak".
    """

    def has_object_permission(self, request, view, obj):
        # Permission ini hanya mengatur penghapusan. Yang lain sudah ditangani
        # IsManagerOrOwner, jadi di sini cukup true supaya tidak menambah
        # penolakan yang keliru.
        if request.method != "DELETE":
            return True

        if is_admin(request.user):
            return True

        return (
            obj.reporter_id == request.user.id
            and obj.status == Complaint.Status.PENDING
        )
