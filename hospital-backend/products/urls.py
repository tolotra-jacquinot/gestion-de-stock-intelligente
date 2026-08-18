from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ProductViewSet, stock_alerts

from .views import ProductViewSet, stock_alerts, dashboard_stats


router = DefaultRouter()
router.register(r"products", ProductViewSet)

urlpatterns = [
    path("alerts/", stock_alerts, name="stock-alerts"),
    path("dashboard/stats/", dashboard_stats, name="dashboard-stats"),
]

urlpatterns += router.urls