from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ProductViewSet, stock_alerts


router = DefaultRouter()
router.register(r"products", ProductViewSet)

urlpatterns = [
    path("alerts/", stock_alerts, name="stock-alerts"),
]

urlpatterns += router.urls