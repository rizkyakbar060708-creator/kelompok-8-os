from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.permissions import is_manager


class IsOwnerOrManager(BasePermission):
    """Batasi perubahan dan penghapusan hanya untuk pemilik atau pengelola.

    Berbeda dengan pengaduan fasilitas yang menerapkan scoping pada queryset (404
    jika milik orang lain), item Lost & Found terbuka untuk dibaca oleh seluruh civitas
    (SAFE_METHODS diizinkan). Namun untuk PATCH dan DELETE, user yang bukan pemilik
    dan bukan pengelola (STAFF atau ADMIN) ditolak dengan status 403 Forbidden agar
    laporan tidak dapat dirusak oleh pengguna lain.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if is_manager(request.user):
            return True

        return obj.reporter_id == request.user.id
