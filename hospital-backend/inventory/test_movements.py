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
    StockLocation,
    StockMovement,
)


class StockMovementIntegrityTests(APITestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="magasinier_mouvement_test",
            password="TestPassword123!",
            role="magasinier",
        )

        self.client.force_authenticate(user=self.user)

        self.store = StockLocation.objects.create(
            name="Magasin mouvement test",
            location_type="STORE",
            active=True,
        )

        self.product = Product.objects.create(
            name="Produit test mouvement",
            code="TEST-MOVEMENT-001",
            category="Médicaments",
            stock=10,
            min_stock=5,
            max_stock=100,
            expiration=(
                timezone.localdate()
                + timedelta(days=365)
            ),
            location=self.store.name,
            packaging="Boîte",
            unit_price=Decimal("1000.00"),
            active=True,
            supplier="Fournisseur test",
        )

        self.movement_url = reverse(
            "stockmovement-list"
        )

    def create_store_inventory(
        self,
        product_stock=30,
        store_quantity=20,
    ):
        self.product.stock = product_stock
        self.product.save(
            update_fields=[
                "stock",
                "updated_at",
            ]
        )

        store_stock = LocationStock.objects.create(
            product=self.product,
            location=self.store,
            quantity=store_quantity,
        )

        first_batch = ProductBatch.objects.create(
            product=self.product,
            location=self.store,
            batch_number="LOT-MOVEMENT-FIRST",
            quantity=5,
            expiration_date=(
                timezone.localdate()
                + timedelta(days=30)
            ),
            supplier="Fournisseur test",
            active=True,
        )

        second_batch = ProductBatch.objects.create(
            product=self.product,
            location=self.store,
            batch_number="LOT-MOVEMENT-SECOND",
            quantity=15,
            expiration_date=(
                timezone.localdate()
                + timedelta(days=60)
            ),
            supplier="Fournisseur test",
            active=True,
        )

        return store_stock, first_batch, second_batch

    def test_entry_updates_product_store_batch_and_movement(self):
        expiration_date = (
            timezone.localdate()
            + timedelta(days=90)
        )

        response = self.client.post(
            self.movement_url,
            {
                "product": self.product.id,
                "movement_type": "ENTRY",
                "quantity": 5,
                "reason": "Entrée test",
                "batch_number": "LOT-ENTRY-TEST",
                "expiration_date": expiration_date.isoformat(),
                "batch_supplier": "Fournisseur entrée",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.product.refresh_from_db()

        store_stock = LocationStock.objects.get(
            product=self.product,
            location=self.store,
        )
        batch = ProductBatch.objects.get(
            product=self.product,
            location=self.store,
            batch_number="LOT-ENTRY-TEST",
        )
        movement = StockMovement.objects.get()

        self.assertEqual(self.product.stock, 15)
        self.assertEqual(store_stock.quantity, 5)
        self.assertEqual(batch.quantity, 5)
        self.assertEqual(batch.expiration_date, expiration_date)
        self.assertEqual(
            batch.supplier,
            "Fournisseur entrée",
        )
        self.assertTrue(batch.active)
        self.assertEqual(movement.movement_type, "ENTRY")
        self.assertEqual(movement.quantity, 5)
        self.assertEqual(movement.user, self.user)

    def test_exit_updates_product_store_and_batches_using_fefo(self):
        store_stock, first_batch, second_batch = (
            self.create_store_inventory()
        )

        response = self.client.post(
            self.movement_url,
            {
                "product": self.product.id,
                "movement_type": "EXIT",
                "quantity": 8,
                "reason": "Sortie test",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.product.refresh_from_db()
        store_stock.refresh_from_db()
        first_batch.refresh_from_db()
        second_batch.refresh_from_db()

        self.assertEqual(self.product.stock, 22)
        self.assertEqual(store_stock.quantity, 12)
        self.assertEqual(first_batch.quantity, 0)
        self.assertFalse(first_batch.active)
        self.assertEqual(second_batch.quantity, 12)
        self.assertTrue(second_batch.active)

        movement = StockMovement.objects.get()

        self.assertEqual(movement.movement_type, "EXIT")
        self.assertEqual(movement.quantity, 8)
        self.assertEqual(movement.user, self.user)

    def test_entry_above_maximum_changes_nothing(self):
        store_stock = LocationStock.objects.create(
            product=self.product,
            location=self.store,
            quantity=95,
        )

        self.product.stock = 95
        self.product.save(
            update_fields=[
                "stock",
                "updated_at",
            ]
        )

        response = self.client.post(
            self.movement_url,
            {
                "product": self.product.id,
                "movement_type": "ENTRY",
                "quantity": 10,
                "reason": "Entrée excessive",
                "batch_number": "LOT-ENTRY-REJECT",
                "expiration_date": (
                    timezone.localdate()
                    + timedelta(days=90)
                ).isoformat(),
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

        self.product.refresh_from_db()
        store_stock.refresh_from_db()

        self.assertEqual(self.product.stock, 95)
        self.assertEqual(store_stock.quantity, 95)
        self.assertFalse(
            ProductBatch.objects.filter(
                batch_number="LOT-ENTRY-REJECT",
            ).exists()
        )
        self.assertFalse(StockMovement.objects.exists())

    def test_exit_with_insufficient_global_stock_changes_nothing(self):
        store_stock, first_batch, second_batch = (
            self.create_store_inventory(
                product_stock=5,
            )
        )

        response = self.client.post(
            self.movement_url,
            {
                "product": self.product.id,
                "movement_type": "EXIT",
                "quantity": 8,
                "reason": "Sortie globale impossible",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn(
            "Stock global insuffisant",
            str(response.data["quantity"]),
        )

        self.product.refresh_from_db()
        store_stock.refresh_from_db()
        first_batch.refresh_from_db()
        second_batch.refresh_from_db()

        self.assertEqual(self.product.stock, 5)
        self.assertEqual(store_stock.quantity, 20)
        self.assertEqual(first_batch.quantity, 5)
        self.assertTrue(first_batch.active)
        self.assertEqual(second_batch.quantity, 15)
        self.assertTrue(second_batch.active)
        self.assertFalse(StockMovement.objects.exists())

    def test_entry_batch_date_conflict_rolls_back_everything(self):
        store_stock = LocationStock.objects.create(
            product=self.product,
            location=self.store,
            quantity=5,
        )

        original_expiration = (
            timezone.localdate()
            + timedelta(days=30)
        )
        batch = ProductBatch.objects.create(
            product=self.product,
            location=self.store,
            batch_number="LOT-ENTRY-CONFLICT",
            quantity=5,
            expiration_date=original_expiration,
            supplier="Fournisseur initial",
            active=True,
        )

        self.product.stock = 5
        self.product.save(
            update_fields=[
                "stock",
                "updated_at",
            ]
        )

        response = self.client.post(
            self.movement_url,
            {
                "product": self.product.id,
                "movement_type": "ENTRY",
                "quantity": 3,
                "reason": "Conflit lot test",
                "batch_number": batch.batch_number,
                "expiration_date": (
                    timezone.localdate()
                    + timedelta(days=60)
                ).isoformat(),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn(
            "une autre date d'expiration",
            str(response.data["expiration_date"]),
        )

        self.product.refresh_from_db()
        store_stock.refresh_from_db()
        batch.refresh_from_db()

        self.assertEqual(self.product.stock, 5)
        self.assertEqual(store_stock.quantity, 5)
        self.assertEqual(batch.quantity, 5)
        self.assertEqual(
            batch.expiration_date,
            original_expiration,
        )
        self.assertEqual(
            batch.supplier,
            "Fournisseur initial",
        )
        self.assertTrue(batch.active)
        self.assertFalse(StockMovement.objects.exists())
