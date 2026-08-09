from rest_framework import viewsets
from .permissions import StockMovementPermission

from .models import StockMovement
from .serializers import StockMovementSerializer


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by("-created_at")
    serializer_class = StockMovementSerializer
    permission_classes = [StockMovementPermission]
    
    http_method_names = ["get", "post", "head", "options"]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
