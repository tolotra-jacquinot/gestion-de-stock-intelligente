from django.utils import timezone
from django.db import transaction
from rest_framework import serializers

from products.models import Product

from .models import (
    StockMovement,
    RestockOrder,
    ProductBatch,
    StockTransfer,
    LocationStock,
    StockLocation,
    Sale,
    SaleItem,
    SaleItemBatch,
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

        if movement_type == "ADJUSTMENT":
            raise serializers.ValidationError(
                {
                    "movement_type": (
                        "Les ajustements directs de stock sont temporairement "
                        "désactivés afin d'éviter une désynchronisation entre "
                        "le stock par emplacement et les lots."
                    )
                }
            )

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

            store = StockLocation.objects.filter(
                location_type="STORE",
                active=True,
            ).first()

            if not store:
                raise serializers.ValidationError(
                    {
                        "location": (
                            "Aucun magasin central actif n'est configuré."
                        )
                    }
                )

            store_stock = LocationStock.objects.filter(
                product=product,
                location=store,
            ).first()

            current_store_quantity = (
                store_stock.quantity
                if store_stock
                else 0
            )

            projected_stock = current_store_quantity + quantity

            if projected_stock > product.max_stock:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Cette entrée ferait dépasser "
                            "le stock maximum du magasin central."
                        )
                    }
                )

        if movement_type == "EXIT":
            store = StockLocation.objects.filter(
                location_type="STORE",
                active=True,
            ).first()

            if not store:
                raise serializers.ValidationError(
                    {
                        "location": (
                            "Aucun magasin central actif n'est configuré."
                        )
                    }
                )

            store_stock = LocationStock.objects.filter(
                product=product,
                location=store,
            ).first()

            if not store_stock or store_stock.quantity < quantity:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Stock insuffisant dans le magasin central."
                        )
                    }
                )

            available_batch_stock = sum(
                ProductBatch.objects.filter(
                    product=product,
                    location=store,
                    active=True,
                    quantity__gt=0,
                    expiration_date__gt=timezone.localdate(),
                ).values_list(
                    "quantity",
                    flat=True,
                )
            )

            if quantity > available_batch_stock:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Stock insuffisant dans les lots "
                            "valides du magasin central."
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

        product = (
            Product.objects
            .select_for_update()
            .get(pk=validated_data["product"].pk)
        )

        validated_data["product"] = product

        movement = StockMovement.objects.create(
            **validated_data
        )

        store = StockLocation.objects.get(
            location_type="STORE",
            active=True,
        )

        if movement.movement_type == "ENTRY":
            store_stock, _ = (
                LocationStock.objects
                .select_for_update()
                .get_or_create(
                    product=product,
                    location=store,
                    defaults={"quantity": 0},
                )
            )

            if (
                store_stock.quantity + movement.quantity
                > product.max_stock
            ):
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Cette entrée ferait dépasser "
                            "le stock maximum du magasin central."
                        )
                    }
                )

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

            store_stock.quantity += movement.quantity

            store_stock.save(
                update_fields=[
                    "quantity",
                    "updated_at",
                ]
            )

            product.stock += movement.quantity

        elif movement.movement_type == "EXIT":
            store_stock = (
                LocationStock.objects
                .select_for_update()
                .get(
                    product=product,
                    location=store,
                )
            )

            if store_stock.quantity < movement.quantity:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Stock insuffisant dans le magasin central."
                        )
                    }
                )

            if product.stock < movement.quantity:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Stock global insuffisant "
                            "pour cette sortie."
                        )
                    }
                )
            remaining_quantity = movement.quantity
            batches = (
                ProductBatch.objects
                .select_for_update()
                .filter(
                    product=product,
                    location=store,
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
                for batch in batches
            )

            if available_batch_stock < movement.quantity:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            "Stock insuffisant dans les lots "
                            "valides du magasin central."
                        )
                    }
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

            store_stock.quantity -= movement.quantity

            store_stock.save(
                update_fields=[
                    "quantity",
                    "updated_at",
                ]
            )

            product.stock -= movement.quantity

        elif movement.movement_type == "ADJUSTMENT":
            product.stock = movement.quantity

        product.save(
            update_fields=[
                "stock",
                "updated_at",
            ]
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

class PharmacyStockSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    unit_price = serializers.DecimalField(
        source="product.unit_price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    location_name = serializers.CharField(
        source="location.name",
        read_only=True,
    )

    sellable_quantity = serializers.SerializerMethodField()

    def get_sellable_quantity(self, obj):
        today = timezone.localdate()

        return sum(
            batch.quantity
            for batch in ProductBatch.objects.filter(
                product=obj.product,
                location=obj.location,
                active=True,
                quantity__gt=0,
                expiration_date__gt=today,
            )
        )

    class Meta:
        model = LocationStock
        fields = [
            "id",
            "product",
            "product_name",
            "unit_price",
            "sellable_quantity",
            "location",
            "location_name",
        ]

        read_only_fields = fields

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

        if quantity > source_stock.quantity:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Stock insuffisant dans "
                        "l'emplacement source."
                    )
                }
            )

        available_batch_stock = sum(
            ProductBatch.objects.filter(
                product=product,
                location=source,
                active=True,
                quantity__gt=0,
                expiration_date__gt=timezone.localdate(),
            ).values_list(
                "quantity",
                flat=True,
            )
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

        remaining_quantity = quantity

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

            if (
                not created
                and destination_batch.expiration_date
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

        return StockTransfer.objects.create(
            **validated_data
        )

class SaleItemBatchSerializer(serializers.ModelSerializer):

    batch_number = serializers.CharField(
        source="batch.batch_number",
        read_only=True,
    )

    expiration_date = serializers.DateField(
        source="batch.expiration_date",
        read_only=True,
    )

    class Meta:
        model = SaleItemBatch
        fields = [
            "batch_number",
            "expiration_date",
            "quantity",
        ]

class SaleItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    batch_usages = SaleItemBatchSerializer(
        many=True,
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
            "batch_usages",
        ]

        read_only_fields = [
            "unit_price",
            "subtotal",
        ]


class SaleSerializer(serializers.ModelSerializer):

    receipt_number = serializers.SerializerMethodField()

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
            "receipt_number",
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

    def get_receipt_number(self, obj):
        return f"VENTE-{obj.id:06d}"

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

        product_ids = [
            item["product"].id
            for item in value
        ]

        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError(
                "Un même produit ne peut apparaître qu'une seule fois dans une vente."
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

        product_ids = [
            item_data["product"].id
            for item_data in items_data
        ]

        locked_products = {
            product.id: product
            for product in (
                Product.objects
                .select_for_update()
                .filter(id__in=product_ids)
                .order_by("id")
            )
        }

        stock_entries = {}

        # Vérifier tous les produits avant de créer la vente
        for item_data in items_data:
            product = locked_products[
                item_data["product"].id
            ]
            quantity = item_data["quantity"]

            if product.stock < quantity:
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"Stock global insuffisant "
                            f"pour {product.name}."
                        )
                    }
                )

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
            product = locked_products[
                item_data["product"].id
            ]
            quantity = item_data["quantity"]

            unit_price = product.unit_price
            subtotal = unit_price * quantity

            # Créer d'abord la ligne de vente
            sale_item = SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )

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

                # Enregistrer le lot réellement utilisé
                SaleItemBatch.objects.create(
                    sale_item=sale_item,
                    batch=batch,
                    quantity=quantity_to_take,
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

            if remaining_quantity > 0:
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"Stock insuffisant dans les lots disponibles "
                            f"pour {product.name}."
                        )
                    }
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

            product.stock -= quantity

            product.save(
                update_fields=[
                    "stock",
                    "updated_at",
                ]
            )

            total_amount += subtotal

        sale.total_amount = total_amount

        sale.save(
            update_fields=[
                "total_amount",
            ]
        )

        return sale