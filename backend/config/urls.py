from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "api/auth/login/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # api/auth/blacklist/ sengaja TIDAK didaftarkan di sini. Endpoint itu ada
    # di apps.accounts.urls sebagai BlacklistView yang mewajibkan autentikasi.
    # TokenBlacklistView bawaan SimpleJWT tidak mewajibkan apa pun
    # (TokenViewBase menetapkan permission_classes = ()), dan urlpatterns
    # diselesaikan berurutan, jadi pendaftaran di sini akan membayangi versi
    # yang aman.

    path("api/auth/", include("apps.accounts.urls")),

    path("api/facilities/", include("apps.facilities.urls")),
    path("api/complaints/", include("apps.complaints.urls")),
]

# Django tidak menyajikan MEDIA_ROOT sendiri. static() sengaja hanya aktif saat
# DEBUG; di produksi file upload harus dilayani web server (nginx, whitenoise).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
