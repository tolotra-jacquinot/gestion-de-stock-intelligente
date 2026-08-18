from django.conf import settings
from django.db import models

from products.models import Product


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
