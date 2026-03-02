from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "name", "skill_level", "status", "joining_date")
    list_filter = ("status", "skill_level")
    search_fields = ("employee_id", "name", "phone")
