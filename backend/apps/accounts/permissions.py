from rest_framework.permissions import SAFE_METHODS, BasePermission


def is_admin(user) -> bool:
    """Cek role aplikasi, bukan flag is_staff bawaan Django.

    Model User punya field `role` sendiri dan itu yang dipakai frontend untuk
    menentukan akses, jadi otorisasi harus konsisten dengan field itu.
    """
    return user.is_authenticated and getattr(user, "role", None) == "ADMIN"


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return is_admin(request.user)


class IsOwnerOrAdmin(BasePermission):
    """Batasi akses ke objek milik sendiri; admin bebas akses semuanya.

    Layer kedua. Yang benar-benar mencegah user A membaca atau mengubah
    pengaduan user B adalah get_queryset() yang di-scope per user di view,
    karena objek milik orang lain harus terlihat tidak ada (404), bukan
    forbidden (403) yang membocorkan bahwa id itu memang ada.

    Sengaja tidak memakai early-return untuk SAFE_METHODS seperti contoh DRF:
    kalau suatu saat get_queryset() dilonggarkan, objek milik orang lain tetap
    harus ditolak saat dibaca, bukan hanya saat ditulis.
    """

    def has_object_permission(self, request, view, obj):
        if is_admin(request.user):
            return True

        return getattr(obj, "reporter_id", None) == request.user.id
