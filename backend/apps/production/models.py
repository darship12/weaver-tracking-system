from django.db import models
from apps.employee.models import Employee

class Production(models.Model):
    QUALITY_CHOICES = [
        ("good", "Good"),
        ("average", "Average"),
        ("defective", "Defective"),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="productions")
    date = models.DateField()
    loom_number = models.CharField(max_length=20)
    design = models.CharField(max_length=100)
    meter_woven = models.DecimalField(max_digits=8, decimal_places=2)
    defects = models.IntegerField(default=0)
    work_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.0)
    quality = models.CharField(max_length=20, choices=QUALITY_CHOICES, default="good")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.employee.name} - {self.date} - {self.meter_woven}m"
