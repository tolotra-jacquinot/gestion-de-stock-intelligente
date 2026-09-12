from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet,
    stock_alerts,
    dashboard_stats,
    consumption_analysis,
)


router = DefaultRouter()
router.register(r"products", ProductViewSet)

urlpatterns = [
    path("alerts/", stock_alerts, name="stock-alerts"),
    path("dashboard/stats/", dashboard_stats, name="dashboard-stats"),
    path("consumption/", consumption_analysis, name="consumption-analysis"),
]

urlpatterns += router.urls
