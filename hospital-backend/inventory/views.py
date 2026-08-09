from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import StockMovement
from .serializers import StockMovementSerializer


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by("-created_at")
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
