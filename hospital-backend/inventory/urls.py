from rest_framework.routers import DefaultRouter

from .views import StockMovementViewSet


router = DefaultRouter()
router.register(r"movements", StockMovementViewSet)

urlpatterns = router.urls