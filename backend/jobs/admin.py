from django.contrib import admin
from .models import JobApplication

# Register your models here.
@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("company", "role", "status", "user", "applied_date", "created_at")
    list_filter = ("status", "applied_date", "created_at")
    search_fields = ("company", "role", "user__username")
    ordering = ("-created_at",)