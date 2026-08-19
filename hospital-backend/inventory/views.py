from rest_framework import viewsets

from .permissions import (
    StockMovementPermission,
    RestockOrderPermission,
)

from .models import StockMovement, RestockOrder

from .serializers import (
    StockMovementSerializer,
    RestockOrderSerializer,
)

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by("-created_at")
    serializer_class = StockMovementSerializer
    permission_classes = [StockMovementPermission]
    
    http_method_names = ["get", "post", "head", "options"]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RestockOrderViewSet(viewsets.ModelViewSet):
    queryset = RestockOrder.objects.all().order_by("-created_at")
    serializer_class = RestockOrderSerializer
    permission_classes = [RestockOrderPermission]

    http_method_names = [
        "get",
        "post",
        "patch",
        "head",
        "options",
    ]

    def perform_create(self, serializer):
        serializer.save(
            requested_by=self.request.user
        )