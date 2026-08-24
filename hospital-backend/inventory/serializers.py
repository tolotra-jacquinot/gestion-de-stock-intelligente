from django.utils import timezone
from django.db import transaction
from rest_framework import serializers

from .models import (
    StockMovement,
    RestockOrder,
    ProductBatch,
    StockTransfer,
    LocationStock,
    StockLocation,
    Sale,
    SaleItem,
)

def validate_batch_expiration(value):
    today = timezone.localdate()

    if value <= today:
        raise serializers.ValidationError(
            "La date d'expiration du lot doit être postérieure à aujourd'hui."
        )

    return value

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

            try:
                validate_batch_expiration(expiration_date)
            except serializers.ValidationError as exc:
                raise serializers.ValidationError(
                    {
                        "expiration_date": exc.detail
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
                    expiration_date__gt=timezone.localdate(),
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

        store = StockLocation.objects.get(
            location_type="STORE",
            active=True,
        )

        if movement.movement_type == "ENTRY":

            if batch_number and expiration_date:
                batch, created = ProductBatch.objects.get_or_create(
                    product=product,
                    batch_number=batch_number,
                    location=store,
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
                    expiration_date__gt=timezone.localdate(),
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

    def validate_expiration_date(self, value):
        return validate_batch_expiration(value)

class StockTransferSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    source_name = serializers.CharField(
        source="source.name",
        read_only=True,
    )

    destination_name = serializers.CharField(
        source="destination.name",
        read_only=True,
    )

    transferred_by_name = serializers.CharField(
        source="transferred_by.username",
        read_only=True,
    )

    class Meta:
        model = StockTransfer
        fields = "__all__"

        read_only_fields = [
            "transferred_by",
            "created_at",
        ]

    def validate(self, attrs):
        source = attrs.get("source")
        destination = attrs.get("destination")
        quantity = attrs.get("quantity")
        product = attrs.get("product")

        if source == destination:
            raise serializers.ValidationError(
                {
                    "destination": (
                        "La source et la destination "
                        "doivent être différentes."
                    )
                }
            )

        if quantity <= 0:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "La quantité doit être supérieure à zéro."
                    )
                }
            )

        source_stock = LocationStock.objects.filter(
            product=product,
            location=source,
        ).first()

        if not source_stock:
            raise serializers.ValidationError(
                {
                    "source": (
                        "Aucun stock n'existe pour ce produit "
                        "dans l'emplacement source."
                    )
                }
            )

        remaining_quantity = quantity

        source_batches = (
            ProductBatch.objects
            .select_for_update()
            .filter(
                product=product,
                location=source,
                active=True,
                quantity__gt=0,
                expiration_date__gt=timezone.localdate(),
            )
            .order_by(
                "expiration_date",
                "received_at",
            )
        )

        available_batch_stock = sum(
            batch.quantity
            for batch in source_batches
        )

        if available_batch_stock < quantity:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Stock insuffisant dans les lots "
                        "disponibles de l'emplacement source."
                    )
                }
            )

        for source_batch in source_batches:
            if remaining_quantity <= 0:
                break

            quantity_to_transfer = min(
                source_batch.quantity,
                remaining_quantity,
            )

            destination_batch, created = (
                ProductBatch.objects
                .select_for_update()
                .get_or_create(
                    product=product,
                    batch_number=source_batch.batch_number,
                    location=destination,
                    defaults={
                        "quantity": 0,
                        "expiration_date": (
                            source_batch.expiration_date
                        ),
                        "supplier": source_batch.supplier,
                        "active": True,
                    },
                )
            )

            if not created:
                if (
                    destination_batch.expiration_date
                    != source_batch.expiration_date
                ):
                    raise serializers.ValidationError(
                        {
                            "batch": (
                                "Le même numéro de lot existe "
                                "dans la destination avec une "
                                "date d'expiration différente."
                            )
                        }
                    )

            source_batch.quantity -= quantity_to_transfer
            destination_batch.quantity += quantity_to_transfer

            if source_batch.quantity == 0:
                source_batch.active = False

            destination_batch.active = True

            source_batch.save(
                update_fields=[
                    "quantity",
                    "active",
                    "updated_at",
                ]
            )

            destination_batch.save(
                update_fields=[
                    "quantity",
                    "active",
                    "updated_at",
                ]
            )

            remaining_quantity -= quantity_to_transfer

        if quantity > source_stock.quantity:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Stock insuffisant dans "
                        "l'emplacement source."
                    )
                }
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        product = validated_data["product"]
        source = validated_data["source"]
        destination = validated_data["destination"]
        quantity = validated_data["quantity"]

        source_stock = (
            LocationStock.objects
            .select_for_update()
            .get(
                product=product,
                location=source,
            )
        )

        destination_stock, _ = (
            LocationStock.objects
            .select_for_update()
            .get_or_create(
                product=product,
                location=destination,
                defaults={
                    "quantity": 0,
                },
            )
        )

        if source_stock.quantity < quantity:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Stock insuffisant dans "
                        "l'emplacement source."
                    )
                }
            )

        source_stock.quantity -= quantity
        destination_stock.quantity += quantity

        source_stock.save(
            update_fields=[
                "quantity",
                "updated_at",
            ]
        )

        destination_stock.save(
            update_fields=[
                "quantity",
                "updated_at",
            ]
        )

        transfer = StockTransfer.objects.create(
            **validated_data
        )

        return transfer

class SaleItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "unit_price",
            "subtotal",
        ]

        read_only_fields = [
            "unit_price",
            "subtotal",
        ]


class SaleSerializer(serializers.ModelSerializer):

    items = SaleItemSerializer(
        many=True,
    )

    sold_by_name = serializers.CharField(
        source="sold_by.username",
        read_only=True,
    )

    pharmacy_name = serializers.CharField(
        source="pharmacy.name",
        read_only=True,
    )

    class Meta:
        model = Sale
        fields = [
            "id",
            "pharmacy",
            "pharmacy_name",
            "sold_by",
            "sold_by_name",
            "customer_name",
            "total_amount",
            "created_at",
            "items",
        ]

        read_only_fields = [
            "sold_by",
            "total_amount",
            "created_at",
        ]

    def validate_pharmacy(self, value):
        if value.location_type != "PHARMACY":
            raise serializers.ValidationError(
                "La vente doit être enregistrée dans une pharmacie."
            )

        if not value.active:
            raise serializers.ValidationError(
                "Cette pharmacie est inactive."
            )

        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "La vente doit contenir au moins un produit."
            )

        for item in value:
            if item["quantity"] <= 0:
                raise serializers.ValidationError(
                    "La quantité doit être supérieure à zéro."
                )

        return value

    @transaction.atomic
    def create(self, validated_data):

        items_data = validated_data.pop(
            "items"
        )

        pharmacy = validated_data["pharmacy"]

        stock_entries = {}

        for item_data in items_data:
            product = item_data["product"]
            quantity = item_data["quantity"]

            pharmacy_stock = (
                LocationStock.objects
                .select_for_update()
                .filter(
                    product=product,
                    location=pharmacy,
                )
                .first()
            )

            if (
                not pharmacy_stock
                or pharmacy_stock.quantity < quantity
            ):
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"Stock pharmacie insuffisant "
                            f"pour {product.name}."
                        )
                    }
                )

            available_batch_stock = sum(
                batch.quantity
                for batch in (
                    ProductBatch.objects
                    .filter(
                        product=product,
                        location=pharmacy,
                        active=True,
                        quantity__gt=0,
                        expiration_date__gt=timezone.localdate(),
                    )
                )
            )

            if available_batch_stock < quantity:
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"Stock insuffisant dans les lots "
                            f"disponibles pour {product.name}."
                        )
                    }
                )

            stock_entries[product.id] = pharmacy_stock

        sale = Sale.objects.create(
            **validated_data
        )

        total_amount = 0

        for item_data in items_data:
            product = item_data["product"]
            quantity = item_data["quantity"]

            remaining_quantity = quantity

            batches = (
                ProductBatch.objects
                .select_for_update()
                .filter(
                    product=product,
                    location=pharmacy,
                    active=True,
                    quantity__gt=0,
                    expiration_date__gt=timezone.localdate(),
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

            pharmacy_stock = stock_entries[
                product.id
            ]

            pharmacy_stock.quantity -= quantity

            pharmacy_stock.save(
                update_fields=[
                    "quantity",
                    "updated_at",
                ]
            )

            unit_price = product.unit_price
            subtotal = unit_price * quantity

            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )

            total_amount += subtotal

        sale.total_amount = total_amount

        sale.save(
            update_fields=[
                "total_amount",
            ]
        )

        return sale