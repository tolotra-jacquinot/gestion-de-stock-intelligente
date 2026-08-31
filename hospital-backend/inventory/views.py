from products.models import Product
from django.db import transaction
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .permissions import (
    StockMovementPermission,
    RestockOrderPermission,
)

from .models import (
    StockMovement,
    RestockOrder,
    ProductBatch,
    StockTransfer,
    StockLocation,
    LocationStock,
    Sale,
)

from .serializers import (
    StockMovementSerializer,
    RestockOrderSerializer,
    ProductBatchSerializer,
    PharmacyStockSerializer,
    StockTransferSerializer,
    SaleSerializer,
)


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by("-created_at")
    serializer_class = StockMovementSerializer
    permission_classes = [StockMovementPermission]

    http_method_names = ["get", "post", "head", "options"]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ProductBatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductBatch.objects.all().order_by(
        "expiration_date",
        "created_at",
    )

    serializer_class = ProductBatchSerializer

    permission_classes = [
        StockMovementPermission
    ]

class PharmacyStockViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = PharmacyStockSerializer

    permission_classes = [
        StockMovementPermission
    ]

    def get_queryset(self):
        today = timezone.localdate()

        return (
            LocationStock.objects
            .select_related(
                "product",
                "location",
            )
            .filter(
                location__location_type="PHARMACY",
                location__active=True,
                quantity__gt=0,
                product__active=True,
                product__batches__location__location_type="PHARMACY",
                product__batches__active=True,
                product__batches__quantity__gt=0,
                product__batches__expiration_date__gt=today,
            )
            .distinct()
            .order_by(
                "product__name"
            )
        )

class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.all().order_by(
        "-created_at"
    )

    serializer_class = StockTransferSerializer
    permission_classes = [
        StockMovementPermission
    ]

    http_method_names = [
        "get",
        "post",
        "head",
        "options",
    ]

    def perform_create(self, serializer):
        serializer.save(
            transferred_by=self.request.user
        )

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

        product = (
            Product.objects
            .select_for_update()
            .get(pk=restock_order.product_id)
        )

        store = StockLocation.objects.get(
            location_type="STORE",
            active=True,
        )

        store_stock = (
            LocationStock.objects
            .select_for_update()
            .filter(
                product=product,
                location=store,
            )
            .first()
        )

        current_store_stock = (
            store_stock.quantity
            if store_stock
            else 0
        )

        projected_stock = (
            current_store_stock
            + restock_order.quantity
        )

        if projected_stock > product.max_stock:
            return Response(
                {
                    "quantity": (
                        "La réception ferait dépasser "
                        "le stock maximum du magasin central. "
                        f"Stock actuel : {current_store_stock}, "
                        f"quantité à recevoir : "
                        f"{restock_order.quantity}, "
                        f"maximum : {product.max_stock}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        batch_number = request.data.get("batch_number")
        expiration_date = request.data.get("expiration_date")

        if not batch_number:
            return Response(
                {
                    "batch_number": (
                        "Le numéro de lot est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not expiration_date:
            return Response(
                {
                    "expiration_date": (
                        "La date d'expiration du lot est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        batch_serializer = ProductBatchSerializer(
            data={
                "product": product.id,
                "batch_number": batch_number,
                "location": store.id,
                "quantity": restock_order.quantity,
                "expiration_date": expiration_date,
                "supplier": restock_order.supplier,
                "active": True,
            }
        )

        batch_serializer.is_valid(
            raise_exception=True
        )

        batch = batch_serializer.save()
        StockMovementSerializer().create(
            {
                "product": product,
                "user": request.user,
                "movement_type": "ENTRY",
                "quantity": restock_order.quantity,
                "reason": (
                    f"Réception commande #{restock_order.id} "
                    f"- Lot {batch.batch_number}"
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
            {
                "order": RestockOrderSerializer(
                    restock_order
                ).data,
                "batch": ProductBatchSerializer(
                    batch
                ).data,
            }
        )

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by(
        "-created_at"
    )

    serializer_class = SaleSerializer
    permission_classes = [
        StockMovementPermission
    ]

    http_method_names = [
        "get",
        "post",
        "head",
        "options",
    ]

    def perform_create(self, serializer):
        serializer.save(
            sold_by=self.request.user
        )