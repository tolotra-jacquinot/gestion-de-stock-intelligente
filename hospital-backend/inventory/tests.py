from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Product

from .models import (
    LocationStock,
    ProductBatch,
    RestockOrder,
    StockLocation,
    StockMovement,
)


class RestockOrderReceiveTests(APITestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="magasinier_test",
            password="TestPassword123!",
            role="magasinier",
        )

        self.client.force_authenticate(user=self.user)

        self.store = StockLocation.objects.create(
            name="Magasin central test",
            location_type="STORE",
            active=True,
        )

        self.product = Product.objects.create(
            name="Produit test réception",
            code="TEST-RESTOCK-001",
            category="Médicaments",
            stock=20,
            min_stock=10,
            max_stock=100,
            expiration=(
                timezone.localdate()
                + timedelta(days=365)
            ),
            location="Magasin central test",
            packaging="Boîte",
            unit_price=Decimal("1000.00"),
            active=True,
            supplier="Fournisseur test",
        )

        self.store_stock = LocationStock.objects.create(
            product=self.product,
            location=self.store,
            quantity=20,
        )

        self.order = RestockOrder.objects.create(
            product=self.product,
            requested_by=self.user,
            quantity=10,
            supplier="Fournisseur réception",
            status="ORDERED",
        )

        self.receive_url = reverse(
            "restockorder-receive",
            args=[self.order.id],
        )

        self.batch_number = "LOT-RESTOCK-TEST-001"
        self.expiration_date = (
            timezone.localdate()
            + timedelta(days=730)
        )

    def test_receive_order_updates_all_stock_records(self):
        response = self.client.post(
            self.receive_url,
            {
                "batch_number": self.batch_number,
                "expiration_date": (
                    self.expiration_date.isoformat()
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()
        self.product.refresh_from_db()
        self.store_stock.refresh_from_db()

        self.assertEqual(
            self.order.status,
            "RECEIVED",
        )
        self.assertIsNotNone(
            self.order.received_at,
        )
        self.assertEqual(
            self.product.stock,
            30,
        )
        self.assertEqual(
            self.store_stock.quantity,
            30,
        )

        batch = ProductBatch.objects.get(
            product=self.product,
            location=self.store,
            batch_number=self.batch_number,
        )

        self.assertEqual(
            batch.quantity,
            10,
        )
        self.assertEqual(
            batch.expiration_date,
            self.expiration_date,
        )
        self.assertEqual(
            batch.supplier,
            self.order.supplier,
        )
        self.assertTrue(
            batch.active,
        )

        movement = StockMovement.objects.get(
            reason__contains=(
                f"commande #{self.order.id}"
            )
        )

        self.assertEqual(
            movement.movement_type,
            "ENTRY",
        )
        self.assertEqual(
            movement.quantity,
            10,
        )
        self.assertEqual(
            movement.user,
            self.user,
        )

    def test_receive_order_above_maximum_changes_nothing(self):
        self.product.stock = 95
        self.product.save(
            update_fields=[
                "stock",
                "updated_at",
            ]
        )

        self.store_stock.quantity = 95
        self.store_stock.save(
            update_fields=[
                "quantity",
                "updated_at",
            ]
        )

        response = self.client.post(
            self.receive_url,
            {
                "batch_number": self.batch_number,
                "expiration_date": (
                    self.expiration_date.isoformat()
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn(
            "stock maximum",
            str(response.data["quantity"]),
        )

        self.order.refresh_from_db()
        self.product.refresh_from_db()
        self.store_stock.refresh_from_db()

        self.assertEqual(
            self.order.status,
            "ORDERED",
        )
        self.assertIsNone(
            self.order.received_at,
        )
        self.assertEqual(
            self.product.stock,
            95,
        )
        self.assertEqual(
            self.store_stock.quantity,
            95,
        )
        self.assertFalse(
            ProductBatch.objects.filter(
                batch_number=self.batch_number,
            ).exists()
        )
        self.assertFalse(
            StockMovement.objects.filter(
                reason__contains=(
                    f"commande #{self.order.id}"
                )
            ).exists()
        )
