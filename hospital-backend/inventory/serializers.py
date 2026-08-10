from django.db import transaction
from rest_framework import serializers

from .models import StockMovement


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
                    "quantity": "Stock insuffisant pour effectuer cette sortie."
                }
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        movement = StockMovement.objects.create(**validated_data)

        product = movement.product

        if movement.movement_type == "ENTRY":
            product.stock += movement.quantity

        elif movement.movement_type == "EXIT":
            product.stock -= movement.quantity

        elif movement.movement_type == "ADJUSTMENT":
            product.stock = movement.quantity

        product.save(update_fields=["stock"])

        return movement
