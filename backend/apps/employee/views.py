from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from .models import Employee
from .serializers import EmployeeSerializer, EmployeeListSerializer

class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "skill_level"]
    search_fields = ["name", "employee_id", "phone"]
    ordering_fields = ["name", "joining_date", "created_at"]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return EmployeeListSerializer
        return EmployeeSerializer

    def list(self, request, *args, **kwargs):
        cache_key = f"employees_list_{request.query_params}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 60)
        return response

class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def perform_update(self, serializer):
        serializer.save()
        cache.clear()

class EmployeeStatsView(APIView):
    def get(self, request):
        total = Employee.objects.count()
        active = Employee.objects.filter(status="active").count()
        inactive = Employee.objects.filter(status="inactive").count()
        by_skill = {
            skill: Employee.objects.filter(skill_level=skill).count()
            for skill, _ in Employee.SKILL_CHOICES
        }
        return Response({
            "total": total,
            "active": active,
            "inactive": inactive,
            "by_skill": by_skill,
        })
