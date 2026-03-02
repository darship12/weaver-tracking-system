from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Avg
from apps.employee.models import Employee
from apps.attendance.models import Attendance
from apps.production.models import Production
from apps.salary.models import Salary
import io

class DashboardReportView(APIView):
    def get(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)

        data = {
            "total_employees": Employee.objects.filter(status="active").count(),
            "today_present": Attendance.objects.filter(date=today, status="present").count(),
            "today_absent": Attendance.objects.filter(date=today, status="absent").count(),
            "today_production_meters": float(
                Production.objects.filter(date=today).aggregate(t=Sum("meter_woven"))["t"] or 0
            ),
            "monthly_production_meters": float(
                Production.objects.filter(date__gte=month_start).aggregate(t=Sum("meter_woven"))["t"] or 0
            ),
            "monthly_salary_total": float(
                Salary.objects.filter(month=today.month, year=today.year).aggregate(t=Sum("total_salary"))["t"] or 0
            ),
        }
        return Response(data)

class DailyReportView(APIView):
    def get(self, request):
        date_str = request.query_params.get("date", str(timezone.now().date()))
        from datetime import date
        try:
            report_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({"error": "Invalid date"}, status=status.HTTP_400_BAD_REQUEST)

        attendance = Attendance.objects.filter(date=report_date).select_related("employee")
        production = Production.objects.filter(date=report_date).select_related("employee")

        return Response({
            "date": str(report_date),
            "attendance": {
                "total": attendance.count(),
                "present": attendance.filter(status="present").count(),
                "absent": attendance.filter(status="absent").count(),
            },
            "production": {
                "total_meters": float(production.aggregate(t=Sum("meter_woven"))["t"] or 0),
                "total_records": production.count(),
                "by_employee": list(
                    production.values("employee__name", "employee__employee_id")
                    .annotate(meters=Sum("meter_woven"))
                    .order_by("-meters")
                )
            }
        })

class MonthlyReportView(APIView):
    def get(self, request):
        month = int(request.query_params.get("month", timezone.now().month))
        year = int(request.query_params.get("year", timezone.now().year))

        production = Production.objects.filter(date__month=month, date__year=year)
        salary = Salary.objects.filter(month=month, year=year)
        attendance = Attendance.objects.filter(date__month=month, date__year=year)

        return Response({
            "month": month,
            "year": year,
            "production": {
                "total_meters": float(production.aggregate(t=Sum("meter_woven"))["t"] or 0),
                "by_employee": list(
                    production.values("employee__name", "employee__employee_id")
                    .annotate(meters=Sum("meter_woven"), days=Count("date", distinct=True))
                    .order_by("-meters")
                )
            },
            "salary": {
                "total": float(salary.aggregate(t=Sum("total_salary"))["t"] or 0),
                "paid": float(salary.filter(status="paid").aggregate(t=Sum("total_salary"))["t"] or 0),
                "pending": float(salary.filter(status="pending").aggregate(t=Sum("total_salary"))["t"] or 0),
            },
            "attendance": {
                "present_count": attendance.filter(status="present").count(),
                "absent_count": attendance.filter(status="absent").count(),
            }
        })

class ExportExcelView(APIView):
    def get(self, request):
        import openpyxl
        report_type = request.query_params.get("type", "production")
        month = int(request.query_params.get("month", timezone.now().month))
        year = int(request.query_params.get("year", timezone.now().year))

        wb = openpyxl.Workbook()
        ws = wb.active

        if report_type == "production":
            ws.title = "Production Report"
            ws.append(["Employee ID", "Name", "Date", "Loom", "Design", "Meters", "Defects", "Hours"])
            records = Production.objects.filter(
                date__month=month, date__year=year
            ).select_related("employee").order_by("date")
            for r in records:
                ws.append([r.employee.employee_id, r.employee.name, str(r.date),
                           r.loom_number, r.design, float(r.meter_woven), r.defects, float(r.work_hours)])

        elif report_type == "salary":
            ws.title = "Salary Report"
            ws.append(["Employee ID", "Name", "Month", "Year", "Total Meters", "Rate", "Base", "Bonus", "Deductions", "Total", "Status"])
            records = Salary.objects.filter(month=month, year=year).select_related("employee")
            for r in records:
                ws.append([r.employee.employee_id, r.employee.name, r.month, r.year,
                           float(r.total_meters), float(r.rate_per_meter), float(r.base_salary),
                           float(r.bonus), float(r.deductions), float(r.total_salary), r.status])

        elif report_type == "attendance":
            ws.title = "Attendance Report"
            ws.append(["Employee ID", "Name", "Date", "Status", "Check In", "Check Out"])
            records = Attendance.objects.filter(
                date__month=month, date__year=year
            ).select_related("employee").order_by("date")
            for r in records:
                ws.append([r.employee.employee_id, r.employee.name, str(r.date),
                           r.status, str(r.check_in or ""), str(r.check_out or "")])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{report_type}_report_{month}_{year}.xlsx"'
        return response
