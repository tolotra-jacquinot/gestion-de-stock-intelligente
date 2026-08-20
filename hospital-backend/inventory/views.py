from django.db import transaction
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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

    @action(detail=True, methods=["post"])
    def order(self, request, pk=None):
        restock_order = self.get_object()

        if restock_order.status != "PENDING":
            return Response(
                {
                    "error": (
                        "Seule une demande en attente "
                        "peut être commandée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        restock_order.status = "ORDERED"
        restock_order.save(
            update_fields=["status", "updated_at"]
        )

        return Response(
            RestockOrderSerializer(restock_order).data
        )

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def receive(self, request, pk=None):
        restock_order = (
            RestockOrder.objects
            .select_for_update()
            .get(pk=pk)
        )

        if restock_order.status != "ORDERED":
            return Response(
                {
                    "error": (
                        "Seule une commande validée "
                        "peut être réceptionnée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        StockMovementSerializer().create(
            {
                "product": restock_order.product,
                "user": request.user,
                "movement_type": "ENTRY",
                "quantity": restock_order.quantity,
                "reason": (
                    f"Réception commande #{restock_order.id}"
                ),
            }
        )

        restock_order.status = "RECEIVED"
        restock_order.received_at = timezone.now()

        restock_order.save(
            update_fields=[
                "status",
                "received_at",
                "updated_at",
            ]
        )

        return Response(
            RestockOrderSerializer(restock_order).data
        )