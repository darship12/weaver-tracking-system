from django.urls import path
from .views import DashboardReportView, DailyReportView, MonthlyReportView, ExportExcelView

urlpatterns = [
    path("dashboard/", DashboardReportView.as_view(), name="dashboard-report"),
    path("daily/", DailyReportView.as_view(), name="daily-report"),
    path("monthly/", MonthlyReportView.as_view(), name="monthly-report"),
    path("export/excel/", ExportExcelView.as_view(), name="export-excel"),
]
