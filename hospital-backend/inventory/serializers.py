from django.db import transaction
from rest_framework import serializers

from .models import StockMovement, RestockOrder


class StockMovementSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = StockMovement
        fields = "__all__"
        read_only_fields = ["user", "created_at"]

    def validate(self, attrs):
        product = attrs.get("product")
        movement_type = attrs.get("movement_type")
        quantity = attrs.get("quantity")

        if movement_type == "EXIT" and quantity > product.stock:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Stock insuffisant pour effectuer cette sortie."
                    )
                }
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        movement = StockMovement.objects.create(
            **validated_data
        )

        product = movement.product

        if movement.movement_type == "ENTRY":
            product.stock += movement.quantity

        elif movement.movement_type == "EXIT":
            product.stock -= movement.quantity

        elif movement.movement_type == "ADJUSTMENT":
            product.stock = movement.quantity

        product.save(
            update_fields=["stock"]
        )

        return movement


class RestockOrderSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    requested_by_name = serializers.CharField(
        source="requested_by.username",
        read_only=True,
    )

    class Meta:
        model = RestockOrder
        fields = "__all__"

        read_only_fields = [
            "requested_by",
            "status",
            "created_at",
            "updated_at",
            "received_at",
        ]

    def validate(self, attrs):
        product = attrs.get("product")
        quantity = attrs.get("quantity")

        if not product:
            return attrs

        active_order_exists = RestockOrder.objects.filter(
            product=product,
            status__in=["PENDING", "ORDERED"],
        ).exists()

        if active_order_exists:
            raise serializers.ValidationError(
                {
                    "product": (
                        "Une demande de réapprovisionnement "
                        "est déjà en cours pour ce produit."
                    )
                }
            )

        if product.stock >= product.max_stock:
            raise serializers.ValidationError(
                {
                    "product": (
                        "Le stock de ce produit ne nécessite "
                        "pas de réapprovisionnement."
                    )
                }
            )

        max_quantity = product.max_stock - product.stock

        if quantity and quantity > max_quantity:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        f"La quantité maximale autorisée est "
                        f"{max_quantity} unité(s)."
                    )
                }
            )

        return attrs

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "La quantité doit être supérieure à zéro."
            )

        return value