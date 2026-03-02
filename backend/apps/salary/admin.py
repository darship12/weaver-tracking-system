from django.contrib import admin
from .models import Salary

@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ("employee", "month", "year", "total_meters", "total_salary", "status")
    list_filter = ("status", "month", "year")
    search_fields = ("employee__name",)
