from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    StockMovementViewSet,
    RestockOrderViewSet,
    ProductBatchViewSet,
    PharmacyStockViewSet,
    StockTransferViewSet,
    SaleViewSet,
    forecast_view,
)


router = DefaultRouter()
router.register(r"movements", StockMovementViewSet)
router.register(r"restock-orders", RestockOrderViewSet)
router.register(r"batches", ProductBatchViewSet)
router.register(r"transfers", StockTransferViewSet)
router.register(r"sales", SaleViewSet)
router.register(
    r"pharmacy-stocks",
    PharmacyStockViewSet,
    basename="pharmacy-stock",
)

urlpatterns = router.urls + [
    path("forecast/", forecast_view, name="forecast"),
]