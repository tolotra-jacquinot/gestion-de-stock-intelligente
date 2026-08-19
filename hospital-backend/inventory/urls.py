from rest_framework.routers import DefaultRouter

from .views import (
    StockMovementViewSet,
    RestockOrderViewSet,
)


router = DefaultRouter()
router.register(r"movements", StockMovementViewSet)
router.register(r"restock-orders", RestockOrderViewSet)

urlpatterns = router.urls
