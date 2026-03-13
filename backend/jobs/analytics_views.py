from datetime import date
from dateutil.relativedelta import relativedelta

from django.db.models import Count
from django.db.models.functions import TruncMonth
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import JobApplication

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = JobApplication.objects.filter(user=request.user)

        total = qs.count()

        # counts by status
        by_status_qs = qs.values("status").annotate(count=Count("id")).order_by("status")
        by_status = {row["status"]: row["count"] for row in by_status_qs}

        # last 6 months (including current month)
        # NOTE: If you don't want python-dateutil dependency, scroll down for alternative.
        start_date = (date.today().replace(day=1) - relativedelta(months=5))
        monthly_qs = (
            qs.filter(created_at__date__gte=start_date)
              .annotate(month=TruncMonth("created_at"))
              .values("month")
              .annotate(count=Count("id"))
              .order_by("month")
        )
        monthly = [
            {"month": row["month"].strftime("%Y-%m"), "count": row["count"]}
            for row in monthly_qs
            if row["month"] is not None
        ]

        # top companies
        top_companies_qs = (
            qs.values("company")
              .annotate(count=Count("id"))
              .order_by("-count", "company")[:5]
        )
        top_companies = list(top_companies_qs)

        # recent jobs (for dashboard)
        recent_qs = qs.order_by("-created_at").values(
            "id", "company", "role", "status", "applied_date", "created_at"
        )[:5]
        recent = list(recent_qs)

        return Response(
            {
                "total": total,
                "by_status": by_status,
                "monthly": monthly,
                "top_companies": top_companies,
                "recent": recent,
            }
        )