from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/employees/", include("apps.employee.urls")),
    path("api/attendance/", include("apps.attendance.urls")),
    path("api/production/", include("apps.production.urls")),
    path("api/salary/", include("apps.salary.urls")),
    path("api/reports/", include("apps.reports.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
