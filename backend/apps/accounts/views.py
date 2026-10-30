from django.contrib.auth import get_user_model

from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenBlacklistView
from django.db.models import Count
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
    BlacklistedToken,
)

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    AdminUserSerializer,
    AdminPasswordResetSerializer,
)
from .permissions import IsAdmin

User = get_user_model()


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


class UserListView(generics.ListAPIView):
    """Daftar semua pengguna (khusus admin), diurutkan username.

    complaints_count dihitung sekali per queryset lewat
    annotate(Count("complaints")), bukan query per baris.
    """

    queryset = (
        User.objects.annotate(complaints_count=Count("complaints"))
        .order_by("username")
    )
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class UserDetailView(generics.UpdateAPIView):
    """Ubah role pengguna (khusus admin). Hanya PATCH tersedia.

    Admin tidak boleh mengubah role akun miliknya sendiri.
    """

    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["patch"]
    lookup_field = "pk"

    def perform_update(self, serializer):
        if serializer.instance == self.request.user:
            raise serializers.ValidationError(
                {"role": "Tidak dapat mengubah role akun Anda sendiri."}
            )

        serializer.save()


class UserPasswordResetView(APIView):
    """Reset password pengguna lain oleh admin (POST).

    Respons 204 tanpa body agar password atau hash tidak pernah dikembalikan.
    Setelah berhasil, semua refresh token milik target masuk blacklist agar
    sesi lama tidak dapat digunakan lagi.
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    authentication_classes = [JWTAuthentication]

    def post(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if target == request.user:
            return Response(
                {"password": ["Tidak dapat mereset password akun Anda sendiri."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AdminPasswordResetSerializer(
            data=request.data, context={"user": target}
        )
        serializer.is_valid(raise_exception=True)

        target.set_password(serializer.validated_data["password"])
        target.save()

        # Cabut semua refresh token lama milik target setelah password diubah
        # sehingga sesi yang masih aktif tidak dapat diakses ulang.
        for token in OutstandingToken.objects.filter(user=target):
            BlacklistedToken.objects.get_or_create(token=token)

        return Response(status=status.HTTP_204_NO_CONTENT)
