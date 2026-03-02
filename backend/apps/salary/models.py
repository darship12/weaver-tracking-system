from django.db import models
from apps.employee.models import Employee

class Salary(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("partial", "Partial"),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="salaries")
    month = models.IntegerField()
    year = models.IntegerField()
    total_meters = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rate_per_meter = models.DecimalField(max_digits=8, decimal_places=2)
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["employee", "month", "year"]
        ordering = ["-year", "-month"]

    def __str__(self):
        return f"{self.employee.name} - {self.month}/{self.year}"
