from django.urls import path
from .views import SalaryListView, SalaryDetailView, CalculateSalaryView

urlpatterns = [
    path("", SalaryListView.as_view(), name="salary-list"),
    path("<int:pk>/", SalaryDetailView.as_view(), name="salary-detail"),
    path("calculate/", CalculateSalaryView.as_view(), name="salary-calculate"),
]
