from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Salary
from .serializers import SalarySerializer
from .services import calculate_salary
from apps.employee.models import Employee
from kafka_service.producer import KafkaProducer
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SalaryListView(generics.ListAPIView):
    serializer_class = SalarySerializer

    def get_queryset(self):
        qs = Salary.objects.select_related("employee")
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        employee = self.request.query_params.get("employee")
        if month:
            qs = qs.filter(month=month)
        if year:
            qs = qs.filter(year=year)
        if employee:
            qs = qs.filter(employee_id=employee)
        return qs

class SalaryDetailView(generics.RetrieveUpdateAPIView):
    queryset = Salary.objects.select_related("employee")
    serializer_class = SalarySerializer

class CalculateSalaryView(APIView):
    def post(self, request):
        month = request.data.get("month", timezone.now().month)
        year = request.data.get("year", timezone.now().year)
        employee_id = request.data.get("employee_id")

        if employee_id:
            employees = Employee.objects.filter(id=employee_id, status="active")
        else:
            employees = Employee.objects.filter(status="active")

        results = []
        for employee in employees:
            salary = calculate_salary(employee, month, year)
            results.append({
                "employee": employee.name,
                "employee_id": employee.employee_id,
                "total_salary": float(salary.total_salary),
                "month": month,
                "year": year,
            })
            try:
                producer = KafkaProducer()
                producer.publish(
                    settings.KAFKA_TOPICS["SALARY_CALCULATED"],
                    {"salary_id": salary.id, "employee_id": employee.id, "total": float(salary.total_salary)}
                )
            except Exception as e:
                logger.warning(f"Kafka publish failed: {e}")

        return Response({"calculated": len(results), "results": results})
