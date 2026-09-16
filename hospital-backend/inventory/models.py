from django.conf import settings
from django.db import models

from products.models import Product

class StockLocation(models.Model):

    LOCATION_TYPES = [
        ("STORE", "Magasin"),
        ("PHARMACY", "Pharmacie"),
    ]

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    location_type = models.CharField(
        max_length=20,
        choices=LOCATION_TYPES,
    )

    active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.name

class LocationStock(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="location_stocks",
    )

    location = models.ForeignKey(
        StockLocation,
        on_delete=models.CASCADE,
        related_name="product_stocks",
    )

    quantity = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "location"],
                name="unique_product_stock_per_location",
            )
        ]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.location.name} : "
            f"{self.quantity}"
        )

class StockTransfer(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_transfers",
    )

    source = models.ForeignKey(
        StockLocation,
        on_delete=models.PROTECT,
        related_name="outgoing_transfers",
    )

    destination = models.ForeignKey(
        StockLocation,
        on_delete=models.PROTECT,
        related_name="incoming_transfers",
    )

    quantity = models.PositiveIntegerField()

    transferred_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="stock_transfers",
    )

    reason = models.CharField(
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return (
            f"{self.product.name} : "
            f"{self.source.name} → "
            f"{self.destination.name} "
            f"({self.quantity})"
        )

class StockMovement(models.Model):

    MOVEMENT_TYPES = [
        ("ENTRY", "Entrée"),
        ("EXIT", "Sortie"),
        ("ADJUSTMENT", "Ajustement"),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_movements",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )

    movement_type = models.CharField(
        max_length=20,
        choices=MOVEMENT_TYPES,
    )

    quantity = models.PositiveIntegerField()

    reason = models.CharField(
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.product.name} - {self.movement_type} ({self.quantity})"

class RestockOrder(models.Model):

    STATUS_CHOICES = [
        ("PENDING", "En attente"),
        ("ORDERED", "Commandée"),
        ("RECEIVED", "Réceptionnée"),
        ("CANCELLED", "Annulée"),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="restock_orders",
    )

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="restock_orders",
    )

    quantity = models.PositiveIntegerField()

    supplier = models.CharField(
        max_length=255,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    received_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product"],
                condition=models.Q(
                    status__in=["PENDING", "ORDERED"]
                ),
                name="unique_active_restock_order_per_product",
            )
        ]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.quantity} unités - "
            f"{self.status}"
        )

class ProductBatch(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="batches",
    )

    location = models.ForeignKey(
        StockLocation,
        on_delete=models.PROTECT,
        related_name="batches",
    )

    batch_number = models.CharField(
        max_length=100,
    )

    quantity = models.PositiveIntegerField(
        default=0,
    )

    expiration_date = models.DateField()

    received_at = models.DateTimeField(
        auto_now_add=True,
    )

    supplier = models.CharField(
        max_length=150,
        blank=True,
    )

    active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "product",
                    "batch_number",
                    "location",
                ],
                name="unique_batch_number_per_location",
            )
        ]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.batch_number}"
        )

class Sale(models.Model):

    pharmacy = models.ForeignKey(
        StockLocation,
        on_delete=models.PROTECT,
        related_name="sales",
    )

    sold_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sales",
    )

    customer_name = models.CharField(
        max_length=150,
        blank=True,
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return (
            f"Vente #{self.id} - "
            f"{self.pharmacy.name}"
        )


class SaleItem(models.Model):

    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="sale_items",
    )

    quantity = models.PositiveIntegerField()

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="sale_item_quantity_gt_zero",
            )
        ]

    def __str__(self):
        return (
            f"Vente #{self.sale_id} - "
            f"{self.product.name} x {self.quantity}"
        )

class SaleItemBatch(models.Model):

    sale_item = models.ForeignKey(
        SaleItem,
        on_delete=models.CASCADE,
        related_name="batch_usages",
    )

    batch = models.ForeignKey(
        ProductBatch,
        on_delete=models.PROTECT,
        related_name="sale_usages",
    )

    quantity = models.PositiveIntegerField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="sale_item_batch_quantity_gt_zero",
            )
        ]

    def __str__(self):
        return (
            f"Vente #{self.sale_item.sale_id} - "
            f"{self.batch.batch_number} "
            f"({self.quantity})"
        )

class Alert(models.Model):

    ALERT_TYPES = [
        ("LOW_STOCK", "Stock faible"),
        ("STOCKOUT_RISK", "Risque de rupture"),
        ("EXPIRING_SOON", "Expiration proche"),
        ("OUT_OF_STOCK", "Rupture de stock"),
    ]

    SEVERITY_CHOICES = [
        ("INFO", "Information"),
        ("WARNING", "Avertissement"),
        ("CRITICAL", "Critique"),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="alerts",
    )

    batch = models.ForeignKey(
        ProductBatch,
        on_delete=models.CASCADE,
        related_name="alerts",
        null=True,
        blank=True,
    )

    alert_type = models.CharField(
        max_length=30,
        choices=ALERT_TYPES,
    )

    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
    )

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False,
    )

    is_resolved = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["is_resolved", "-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "product",
                    "alert_type",
                ],
                condition=models.Q(
                    batch__isnull=True,
                    is_resolved=False,
                ),
                name="unique_active_product_alert_type",
            ),
            models.UniqueConstraint(
                fields=[
                    "product",
                    "batch",
                    "alert_type",
                ],
                condition=models.Q(
                    batch__isnull=False,
                    is_resolved=False,
                ),
                name="unique_active_batch_alert_type",
            ),
        ]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.alert_type} - "
            f"{self.severity}"
        )
