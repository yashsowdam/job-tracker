from django.db import models
from django.conf import settings
from django.db import models

# Create your models here.
class JobApplication(models.Model):
    class Status(models.TextChoices):
        APPLIED = "APPLIED", "Applied"
        INTERVIEW = "INTERVIEW", "Interview"
        OFFER = "OFFER", "Offer"
        REJECTED = "REJECTED", "Rejected"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications"
    )
    company = models.CharField(max_length=120)
    role = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    applied_date = models.DateField(null=True, blank=True)

    link = models.URLField(blank=True)
    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.company} - {self.role} ({self.user})"