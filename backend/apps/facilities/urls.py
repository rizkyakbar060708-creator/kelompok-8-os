from django.urls import path

from .views import FacilityDetailView, FacilityListCreateView


urlpatterns = [
    path(
        "",
        FacilityListCreateView.as_view(),
        name="facility-list-create",
    ),
    path(
        "<int:pk>/",
        FacilityDetailView.as_view(),
        name="facility-detail",
    ),
]