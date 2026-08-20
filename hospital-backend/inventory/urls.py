from rest_framework.routers import DefaultRouter

from .views import (
    StockMovementViewSet,
    RestockOrderViewSet,
    ProductBatchViewSet,
)


router = DefaultRouter()
router.register(r"movements", StockMovementViewSet)
router.register(r"restock-orders", RestockOrderViewSet)
router.register(r"batches", ProductBatchViewSet)

urlpatterns = router.urls
