from django.urls import path

from .views import ComplaintCategoriesView, ComplaintDetailView, ComplaintListCreateView


urlpatterns = [
    path(
        "",
        ComplaintListCreateView.as_view(),
        name="complaint-list-create",
    ),
    path(
        "categories/",
        ComplaintCategoriesView.as_view(),
        name="complaint-categories",
    ),
    path(
        "<int:pk>/",
        ComplaintDetailView.as_view(),
        name="complaint-detail",
    ),
]