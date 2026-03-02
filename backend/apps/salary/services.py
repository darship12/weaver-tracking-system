from apps.production.models import Production
from apps.attendance.models import Attendance
from .models import Salary
from django.db.models import Sum

def calculate_salary(employee, month, year):
    productions = Production.objects.filter(
        employee=employee, date__month=month, date__year=year
    )
    total_meters = productions.aggregate(total=Sum("meter_woven"))["total"] or 0
    rate = employee.salary_rate
    base_salary = float(total_meters) * float(rate)

    # Attendance-based deduction
    present_days = Attendance.objects.filter(
        employee=employee, date__month=month, date__year=year, status="present"
    ).count()
    absent_days = Attendance.objects.filter(
        employee=employee, date__month=month, date__year=year, status="absent"
    ).count()
    deductions = absent_days * 50  # 50 rupees per absent day

    # Bonus for top performers
    bonus = 500 if float(total_meters) > 500 else 0

    total_salary = base_salary + bonus - deductions

    salary, _ = Salary.objects.update_or_create(
        employee=employee, month=month, year=year,
        defaults={
            "total_meters": total_meters,
            "rate_per_meter": rate,
            "base_salary": base_salary,
            "bonus": bonus,
            "deductions": deductions,
            "total_salary": max(total_salary, 0),
        }
    )
    return salary
