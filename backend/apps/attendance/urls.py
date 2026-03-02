from django.urls import path
from .views import AttendanceListCreateView, AttendanceDetailView, AttendanceBulkCreateView, TodayAttendanceView

urlpatterns = [
    path("", AttendanceListCreateView.as_view(), name="attendance-list"),
    path("<int:pk>/", AttendanceDetailView.as_view(), name="attendance-detail"),
    path("bulk/", AttendanceBulkCreateView.as_view(), name="attendance-bulk"),
    path("today/", TodayAttendanceView.as_view(), name="attendance-today"),
]
