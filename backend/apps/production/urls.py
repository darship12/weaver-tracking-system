from django.urls import path
from .views import ProductionListCreateView, ProductionDetailView, ProductionDashboardView

urlpatterns = [
    path("", ProductionListCreateView.as_view(), name="production-list"),
    path("<int:pk>/", ProductionDetailView.as_view(), name="production-detail"),
    path("dashboard/", ProductionDashboardView.as_view(), name="production-dashboard"),
]
