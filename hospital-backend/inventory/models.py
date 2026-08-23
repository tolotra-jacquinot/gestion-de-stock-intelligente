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
                fields=["product", "batch_number"],
                name="unique_batch_number_per_product",
            )
        ]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.batch_number}"
        )