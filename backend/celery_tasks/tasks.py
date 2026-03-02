from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3)
def recalculate_salary_task(self, employee_id, month, year):
    try:
        from apps.employee.models import Employee
        from apps.salary.services import calculate_salary
        employee = Employee.objects.get(id=employee_id)
        salary = calculate_salary(employee, month, year)
        logger.info(f"Salary recalculated for {employee.name}: {salary.total_salary}")
        return {"employee": employee.name, "total_salary": float(salary.total_salary)}
    except Exception as exc:
        logger.error(f"Salary calculation failed: {exc}")
        raise self.retry(exc=exc, countdown=60)

@shared_task
def generate_monthly_report_task(month, year):
    from apps.employee.models import Employee
    from apps.salary.services import calculate_salary
    employees = Employee.objects.filter(status="active")
    count = 0
    for employee in employees:
        calculate_salary(employee, month, year)
        count += 1
    logger.info(f"Monthly salary calculated for {count} employees ({month}/{year})")
    return {"calculated": count, "month": month, "year": year}

@shared_task
def send_daily_report_task():
    from django.utils import timezone
    today = timezone.now().date()
    from apps.attendance.models import Attendance
    from apps.production.models import Production
    from django.db.models import Sum
    present = Attendance.objects.filter(date=today, status="present").count()
    meters = Production.objects.filter(date=today).aggregate(t=Sum("meter_woven"))["t"] or 0
    logger.info(f"Daily Report - Present: {present}, Production: {meters}m")
    return {"date": str(today), "present": present, "meters": float(meters)}
