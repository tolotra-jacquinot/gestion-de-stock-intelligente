from django.db import transaction
from rest_framework import serializers

from .models import StockMovement, RestockOrder, ProductBatch


class StockMovementSerializer(serializers.ModelSerializer):

    batch_number = serializers.CharField(
        write_only=True,
        required=False,
    )

    expiration_date = serializers.DateField(
        write_only=True,
        required=False,
    )

    batch_supplier = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

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

        if movement_type == "ENTRY":
            batch_number = attrs.get("batch_number")
            expiration_date = attrs.get("expiration_date")

            if not batch_number:
                raise serializers.ValidationError(
                    {
                        "batch_number": (
                            "Le numéro de lot est obligatoire "
                            "pour une entrée de stock."
                        )
                    }
                )

            if not expiration_date:
                raise serializers.ValidationError(
                    {
                        "expiration_date": (
                            "La date d'expiration est obligatoire "
                            "pour une entrée de stock."
                        )
                    }
                )

            projected_stock = product.stock + quantity

            if projected_stock > product.max_stock:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Cette entrée ferait dépasser "
                            "le stock maximum du produit."
                        )
                    }
                )

        if movement_type == "EXIT":
            available_batch_stock = sum(
                batch.quantity
                for batch in ProductBatch.objects.filter(
                    product=product,
                    active=True,
                    quantity__gt=0,
                )
            )

            if quantity > available_batch_stock:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Stock insuffisant dans les lots "
                            "pour effectuer cette sortie."
                        )
                    }
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        batch_number = validated_data.pop(
            "batch_number",
            None,
        )
        expiration_date = validated_data.pop(
            "expiration_date",
            None,
        )
        batch_supplier = validated_data.pop(
            "batch_supplier",
            "",
        )

        movement = StockMovement.objects.create(
            **validated_data
        )

        product = movement.product

        if movement.movement_type == "ENTRY":

            if batch_number and expiration_date:
                batch, created = ProductBatch.objects.get_or_create(
                    product=product,
                    batch_number=batch_number,
                    defaults={
                        "quantity": movement.quantity,
                        "expiration_date": expiration_date,
                        "supplier": batch_supplier,
                        "active": True,
                    },
                )

                if not created:
                    if batch.expiration_date != expiration_date:
                        raise serializers.ValidationError(
                            {
                                "expiration_date": (
                                    "Ce numéro de lot existe déjà "
                                    "avec une autre date d'expiration."
                                )
                            }
                        )

                    batch.quantity += movement.quantity
                    batch.active = True

                    if batch_supplier:
                        batch.supplier = batch_supplier

                    batch.save(
                        update_fields=[
                            "quantity",
                            "active",
                            "supplier",
                            "updated_at",
                        ]
                    )

            product.stock += movement.quantity

        elif movement.movement_type == "EXIT":
            remaining_quantity = movement.quantity

            batches = (
                ProductBatch.objects
                .select_for_update()
                .filter(
                    product=product,
                    active=True,
                    quantity__gt=0,
                )
                .order_by(
                    "expiration_date",
                    "received_at",
                )
            )

            for batch in batches:
                if remaining_quantity <= 0:
                    break

                quantity_to_take = min(
                    batch.quantity,
                    remaining_quantity,
                )

                batch.quantity -= quantity_to_take
                remaining_quantity -= quantity_to_take

                if batch.quantity == 0:
                    batch.active = False

                batch.save(
                    update_fields=[
                        "quantity",
                        "active",
                        "updated_at",
                    ]
                )

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

class ProductBatchSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    class Meta:
        model = ProductBatch
        fields = "__all__"

        read_only_fields = [
            "received_at",
            "created_at",
            "updated_at",
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "La quantité du lot doit être supérieure à zéro."
            )

        return value