from datetime import timedelta

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
    StockTransfer,
)


class StockTransferIntegrityTests(APITestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="magasinier_transfert_test",
            password="TestPassword123!",
            role="magasinier",
        )

        self.client.force_authenticate(user=self.user)

        self.store = StockLocation.objects.create(
            name="Magasin transfert test",
            location_type="STORE",
            active=True,
        )

        self.pharmacy = StockLocation.objects.create(
            name="Pharmacie transfert test",
            location_type="PHARMACY",
            active=True,
        )

        self.product = Product.objects.create(
            name="Produit test transfert",
            code="TEST-TRANSFER-001",
            category="Médicaments",
            stock=30,
            min_stock=10,
            max_stock=100,
            expiration=(
                timezone.localdate()
                + timedelta(days=365)
            ),
            location=self.store.name,
            packaging="Boîte",
            unit_price="1000.00",
            active=True,
            supplier="Fournisseur test",
        )

        self.source_stock = LocationStock.objects.create(
            product=self.product,
            location=self.store,
            quantity=20,
        )

        self.first_batch = ProductBatch.objects.create(
            product=self.product,
            location=self.store,
            batch_number="LOT-TRANSFER-FIRST",
            quantity=5,
            expiration_date=(
                timezone.localdate()
                + timedelta(days=30)
            ),
            supplier="Fournisseur test",
            active=True,
        )

        self.second_batch = ProductBatch.objects.create(
            product=self.product,
            location=self.store,
            batch_number="LOT-TRANSFER-SECOND",
            quantity=15,
            expiration_date=(
                timezone.localdate()
                + timedelta(days=60)
            ),
            supplier="Fournisseur test",
            active=True,
        )

        self.transfer_url = reverse(
            "stocktransfer-list"
        )

    def transfer_payload(self, quantity=8):
        return {
            "product": self.product.id,
            "source": self.store.id,
            "destination": self.pharmacy.id,
            "quantity": quantity,
            "reason": "Réapprovisionnement pharmacie test",
        }

    def test_transfer_moves_stock_and_batches_using_fefo(self):
        response = self.client.post(
            self.transfer_url,
            self.transfer_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.product.refresh_from_db()
        self.source_stock.refresh_from_db()
        self.first_batch.refresh_from_db()
        self.second_batch.refresh_from_db()

        destination_stock = LocationStock.objects.get(
            product=self.product,
            location=self.pharmacy,
        )

        self.assertEqual(self.product.stock, 30)
        self.assertEqual(self.source_stock.quantity, 12)
        self.assertEqual(destination_stock.quantity, 8)

        self.assertEqual(self.first_batch.quantity, 0)
        self.assertFalse(self.first_batch.active)
        self.assertEqual(self.second_batch.quantity, 12)
        self.assertTrue(self.second_batch.active)

        first_destination_batch = ProductBatch.objects.get(
            product=self.product,
            location=self.pharmacy,
            batch_number=self.first_batch.batch_number,
        )
        second_destination_batch = ProductBatch.objects.get(
            product=self.product,
            location=self.pharmacy,
            batch_number=self.second_batch.batch_number,
        )

        self.assertEqual(first_destination_batch.quantity, 5)
        self.assertEqual(second_destination_batch.quantity, 3)
        self.assertEqual(
            first_destination_batch.expiration_date,
            self.first_batch.expiration_date,
        )
        self.assertEqual(
            second_destination_batch.expiration_date,
            self.second_batch.expiration_date,
        )

        transfer = StockTransfer.objects.get()

        self.assertEqual(transfer.product, self.product)
        self.assertEqual(transfer.source, self.store)
        self.assertEqual(transfer.destination, self.pharmacy)
        self.assertEqual(transfer.quantity, 8)
        self.assertEqual(transfer.transferred_by, self.user)

    def test_transfer_with_insufficient_valid_batches_changes_nothing(self):
        self.second_batch.expiration_date = (
            timezone.localdate()
        )
        self.second_batch.save(
            update_fields=[
                "expiration_date",
                "updated_at",
            ]
        )

        response = self.client.post(
            self.transfer_url,
            self.transfer_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn(
            "Stock insuffisant dans les lots",
            str(response.data["quantity"]),
        )

        self.product.refresh_from_db()
        self.source_stock.refresh_from_db()
        self.first_batch.refresh_from_db()
        self.second_batch.refresh_from_db()

        self.assertEqual(self.product.stock, 30)
        self.assertEqual(self.source_stock.quantity, 20)
        self.assertEqual(self.first_batch.quantity, 5)
        self.assertEqual(self.second_batch.quantity, 15)

        self.assertFalse(
            LocationStock.objects.filter(
                product=self.product,
                location=self.pharmacy,
            ).exists()
        )
        self.assertFalse(
            ProductBatch.objects.filter(
                product=self.product,
                location=self.pharmacy,
            ).exists()
        )
        self.assertFalse(StockTransfer.objects.exists())

    def test_batch_date_conflict_rolls_back_entire_transfer(self):
        destination_stock = LocationStock.objects.create(
            product=self.product,
            location=self.pharmacy,
            quantity=2,
        )

        conflicting_batch = ProductBatch.objects.create(
            product=self.product,
            location=self.pharmacy,
            batch_number=self.second_batch.batch_number,
            quantity=2,
            expiration_date=(
                timezone.localdate()
                + timedelta(days=90)
            ),
            supplier="Autre fournisseur",
            active=True,
        )

        response = self.client.post(
            self.transfer_url,
            self.transfer_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn(
            "date d'expiration différente",
            str(response.data["batch"]),
        )

        self.product.refresh_from_db()
        self.source_stock.refresh_from_db()
        destination_stock.refresh_from_db()
        self.first_batch.refresh_from_db()
        self.second_batch.refresh_from_db()
        conflicting_batch.refresh_from_db()

        self.assertEqual(self.product.stock, 30)
        self.assertEqual(self.source_stock.quantity, 20)
        self.assertEqual(destination_stock.quantity, 2)
        self.assertEqual(self.first_batch.quantity, 5)
        self.assertTrue(self.first_batch.active)
        self.assertEqual(self.second_batch.quantity, 15)
        self.assertTrue(self.second_batch.active)
        self.assertEqual(conflicting_batch.quantity, 2)

        self.assertFalse(
            ProductBatch.objects.filter(
                product=self.product,
                location=self.pharmacy,
                batch_number=self.first_batch.batch_number,
            ).exists()
        )
