from rest_framework import serializers
from .models import Attendance
from apps.employee.serializers import EmployeeListSerializer

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_id_code = serializers.CharField(source="employee.employee_id", read_only=True)

    class Meta:
        model = Attendance
        fields = "__all__"

class AttendanceBulkSerializer(serializers.Serializer):
    date = serializers.DateField()
    records = serializers.ListField(child=serializers.DictField())

    def validate_records(self, value):
        for record in value:
            if "employee" not in record or "status" not in record:
                raise serializers.ValidationError("Each record must have employee and status.")
        return value
