from rest_framework.permissions import SAFE_METHODS, BasePermission

# Nilai enum User.Role ditulis sebagai string supaya modul ini tidak menarik
# model User (dan seluruh rantai import-nya) hanya untuk dua pembanding.
ADMIN_ROLE = "ADMIN"
MANAGER_ROLES = frozenset({"STAFF", ADMIN_ROLE})


def is_admin(user) -> bool:
    """Cek role aplikasi, bukan flag is_staff/is_superuser bawaan Django.

    Model User punya field `role` sendiri dan itu yang dipakai frontend untuk
    menentukan akses, jadi otorisasi harus konsisten dengan field itu.

    `is_superuser` sengaja TIDAK ikut dihitung. Flag itu hanya mengatur akses
    ke situs admin Django, sedangkan di aplikasi ini role adalah satu-satunya
    sumber kebenaran. Kalau keduanya digabung, akun yang berlabel STUDENT akan
    berperilaku seperti admin hanya karena dibuat lewat createsuperuser.
    Supaya akun paradoxical semacam itu tidak muncul, `create_superuser()` di
    model User sudah mengisi `role=ADMIN` secara default.
    """
    if not user.is_authenticated:
        return False

    return getattr(user, "role", None) == ADMIN_ROLE


def is_manager(user) -> bool:
    """Pengelola pengaduan: staf dan admin, tapi bukan mahasiswa.

    Garis antara "boleh menangani pengaduan orang lain" dan "hanya miliknya
    sendiri". Dipakai untuk scoping queryset, hak ubah status/priority, dan
    hak akses ke objek pengaduan.
    """
    if not user.is_authenticated:
        return False

    return getattr(user, "role", None) in MANAGER_ROLES


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return is_admin(request.user)


class IsAdmin(BasePermission):
    """Hanya akun dengan role ADMIN, untuk semua method, tanpa pengecualian read.

    Sengaja jangan memakai IsAdminOrReadOnly untuk manajemen pengguna karena
    itu membuka read untuk semua role. Endpoint /api/users/ harus tetap
    tertutup untuk non-admin baik saat GET maupun PATCH/POST.
    """

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsManagerOrOwner(BasePermission):
    """Batasi akses ke objek milik sendiri; pengelola bebas akses semuanya.

    Layer kedua. Yang benar-benar mencegah user A membaca atau mengubah
    pengaduan user B adalah get_queryset() yang di-scope per user di view,
    karena objek milik orang lain harus terlihat tidak ada (404), bukan
    forbidden (403) yang membocorkan bahwa id itu memang ada.

    Sengaja tidak memakai early-return untuk SAFE_METHODS seperti contoh DRF:
    kalau suatu saat get_queryset() dilonggarkan, objek milik orang lain tetap
    harus ditolak saat dibaca, bukan hanya saat ditulis.
    """

    def has_object_permission(self, request, view, obj):
        if is_manager(request.user):
            return True

        return getattr(obj, "reporter_id", None) == request.user.id
