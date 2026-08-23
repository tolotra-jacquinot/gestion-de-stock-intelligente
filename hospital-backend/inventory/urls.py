from rest_framework.routers import DefaultRouter

from .views import (
    StockMovementViewSet,
    RestockOrderViewSet,
    ProductBatchViewSet,
    StockTransferViewSet,
)


router = DefaultRouter()
router.register(r"movements", StockMovementViewSet)
router.register(r"restock-orders", RestockOrderViewSet)
router.register(r"batches", ProductBatchViewSet)
router.register(r"transfers", StockTransferViewSet)

urlpatterns = router.urls
