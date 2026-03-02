from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.core.cache import cache
from .models import Attendance
from .serializers import AttendanceSerializer, AttendanceBulkSerializer
from kafka_service.producer import KafkaProducer
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class AttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        qs = Attendance.objects.select_related("employee")
        date = self.request.query_params.get("date")
        employee_id = self.request.query_params.get("employee")
        if date:
            qs = qs.filter(date=date)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs

    def perform_create(self, serializer):
        attendance = serializer.save()
        # Publish to Kafka
        try:
            producer = KafkaProducer()
            producer.publish(
                settings.KAFKA_TOPICS["ATTENDANCE_CREATED"],
                {
                    "attendance_id": attendance.id,
                    "employee_id": attendance.employee_id,
                    "date": str(attendance.date),
                    "status": attendance.status,
                }
            )
        except Exception as e:
            logger.warning(f"Kafka publish failed: {e}")
        cache.delete_pattern("attendance_*") if hasattr(cache, "delete_pattern") else cache.clear()

class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Attendance.objects.select_related("employee")
    serializer_class = AttendanceSerializer

class AttendanceBulkCreateView(APIView):
    def post(self, request):
        serializer = AttendanceBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        date = serializer.validated_data["date"]
        records = serializer.validated_data["records"]
        created, updated = 0, 0
        for record in records:
            obj, is_created = Attendance.objects.update_or_create(
                employee_id=record["employee"],
                date=date,
                defaults={"status": record["status"], "notes": record.get("notes", "")},
            )
            if is_created:
                created += 1
            else:
                updated += 1
        return Response({"created": created, "updated": updated, "date": str(date)})

class TodayAttendanceView(APIView):
    def get(self, request):
        today = timezone.now().date()
        records = Attendance.objects.filter(date=today).select_related("employee")
        serializer = AttendanceSerializer(records, many=True)
        present = records.filter(status="present").count()
        absent = records.filter(status="absent").count()
        return Response({
            "date": str(today),
            "total": records.count(),
            "present": present,
            "absent": absent,
            "records": serializer.data,
        })
