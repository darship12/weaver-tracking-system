from django.contrib import admin
from .models import Production

@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = ("employee", "date", "loom_number", "design", "meter_woven", "defects")
    list_filter = ("date", "quality")
    search_fields = ("employee__name", "loom_number", "design")
    date_hierarchy = "date"
