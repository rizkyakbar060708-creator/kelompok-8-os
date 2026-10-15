from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenBlacklistView

from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class BlacklistView(TokenBlacklistView):
    """Blacklist refresh token dengan akses wajib terautentikasi.

    TokenBlacklistView bawaan mewarisi TokenViewBase yang menetapkan
    permission_classes = () supaya login dan refresh bisa dipanggil tanpa
    access token. Untuk blacklist itu celah: siapa pun yang tahu sebuah
    refresh token bisa mencabutnya, termasuk milik orang lain, sehingga sesi
    orang lain bisa dipaksa logout (denial of service).

    Di sini autentikasi JWT diwajibkan supaya hanya pemilik sah yang bisa
    mencabut tokennya sendiri. Respons tetap 200 tanpa body supaya tidak
    membocorkan apakah sebuah token pernah terdaftar.
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
