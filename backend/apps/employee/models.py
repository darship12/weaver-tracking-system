from django.db import models

class Employee(models.Model):
    SKILL_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("expert", "Expert"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("terminated", "Terminated"),
    ]

    employee_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    address = models.TextField(blank=True)
    skill_level = models.CharField(max_length=20, choices=SKILL_CHOICES, default="beginner")
    joining_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    salary_rate = models.DecimalField(max_digits=10, decimal_places=2, default=10.00,
                                      help_text="Rate per meter woven")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.employee_id} - {self.name}"
