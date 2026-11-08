from django.urls import path

from .views import LostFoundDetailView, LostFoundListCreateView

urlpatterns = [
    path(
        "",
        LostFoundListCreateView.as_view(),
        name="lost-found-list-create",
    ),
    path(
        "<int:pk>/",
        LostFoundDetailView.as_view(),
        name="lost-found-detail",
    ),
]
