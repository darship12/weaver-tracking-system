from rest_framework import serializers
from .models import Production

class ProductionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_id_code = serializers.CharField(source="employee.employee_id", read_only=True)

    class Meta:
        model = Production
        fields = "__all__"
