from django.urls import path
from .views import EmployeeListCreateView, EmployeeDetailView, EmployeeStatsView

urlpatterns = [
    path("", EmployeeListCreateView.as_view(), name="employee-list"),
    path("<int:pk>/", EmployeeDetailView.as_view(), name="employee-detail"),
    path("stats/", EmployeeStatsView.as_view(), name="employee-stats"),
]
