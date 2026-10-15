from django.urls import path

from .views import BlacklistView, MeView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    # Wajib lewat view sendiri (bukan TokenBlacklistView bawaan) supaya endpoint
    # ini mewajibkan autentikasi. Lihat BlacklistView di views.py.
    path("blacklist/", BlacklistView.as_view(), name="blacklist"),
]
