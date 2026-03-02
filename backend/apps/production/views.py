from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count
from django.utils import timezone
from datetime import timedelta
from .models import Production
from .serializers import ProductionSerializer
from kafka_service.producer import KafkaProducer
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class ProductionListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductionSerializer

    def get_queryset(self):
        qs = Production.objects.select_related("employee")
        date = self.request.query_params.get("date")
        employee = self.request.query_params.get("employee")
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        if date:
            qs = qs.filter(date=date)
        if employee:
            qs = qs.filter(employee_id=employee)
        if month and year:
            qs = qs.filter(date__month=month, date__year=year)
        return qs

    def perform_create(self, serializer):
        production = serializer.save()
        try:
            producer = KafkaProducer()
            producer.publish(
                settings.KAFKA_TOPICS["PRODUCTION_CREATED"],
                {
                    "production_id": production.id,
                    "employee_id": production.employee_id,
                    "date": str(production.date),
                    "meter_woven": float(production.meter_woven),
                    "loom_number": production.loom_number,
                }
            )
        except Exception as e:
            logger.warning(f"Kafka publish failed: {e}")

class ProductionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Production.objects.select_related("employee")
    serializer_class = ProductionSerializer

class ProductionDashboardView(APIView):
    def get(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)

        today_production = Production.objects.filter(date=today).aggregate(
            total_meters=Sum("meter_woven"),
            total_records=Count("id"),
        )
        monthly_production = Production.objects.filter(date__gte=month_start).aggregate(
            total_meters=Sum("meter_woven"),
            total_records=Count("id"),
        )

        # Top performers this month
        top_performers = Production.objects.filter(date__gte=month_start).values(
            "employee__name", "employee__employee_id"
        ).annotate(total_meters=Sum("meter_woven")).order_by("-total_meters")[:5]

        # Daily trend last 7 days
        seven_days = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            meters = Production.objects.filter(date=d).aggregate(total=Sum("meter_woven"))["total"] or 0
            seven_days.append({"date": str(d), "meters": float(meters)})

        return Response({
            "today": today_production,
            "monthly": monthly_production,
            "top_performers": list(top_performers),
            "weekly_trend": seven_days,
        })
