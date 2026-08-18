from django.db import models


class Product(models.Model):

    CATEGORY_CHOICES = [
        ("Médicaments", "Médicaments"),
        ("Dispositifs", "Dispositifs"),
        ("Solutés", "Solutés"),
    ]

    name = models.CharField(
        max_length=200,
        unique=True
    )

    code = models.CharField(
        max_length=50,
        unique=True
    )

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES
    )

    stock = models.PositiveIntegerField(
        default=0
    )

    min_stock = models.PositiveIntegerField(
        default=10
    )

    max_stock = models.PositiveIntegerField(
        default=100
    )

    expiration = models.DateField()

    location = models.CharField(
        max_length=100
    )

    packaging = models.CharField(
        max_length=100
    )

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    supplier = models.CharField(
        max_length=150,
        blank=True
    )

    def __str__(self):
        return f"{self.code} - {self.name}"