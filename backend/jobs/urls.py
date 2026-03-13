from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import JobApplicationViewSet
from .analytics_views import AnalyticsView

router = DefaultRouter()
router.register(r"jobs", JobApplicationViewSet, basename="jobs")

urlpatterns = [
    path("", include(router.urls)),
    path("analytics/", AnalyticsView.as_view(), name="analytics"),
]