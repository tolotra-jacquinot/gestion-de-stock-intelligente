from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Product

from .models import (
    Alert,
    LocationStock,
    ProductBatch,
    Sale,
    SaleItem,
    SaleItemBatch,
    StockLocation,
)


class SaleStockIntegrityTests(APITestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="magasinier_vente_test",
            password="TestPassword123!",
            role="magasinier",
        )

        self.client.force_authenticate(user=self.user)

        self.pharmacy = StockLocation.objects.create(
            name="Pharmacie test",
            location_type="PHARMACY",
            active=True,
        )

        self.product = Product.objects.create(
            name="Produit test vente",
            code="TEST-SALE-001",
            category="Médicaments",
            stock=30,
            min_stock=10,
            max_stock=100,
            expiration=(
                timezone.localdate()
                + timedelta(days=365)
            ),
            location=self.pharmacy.name,
            packaging="Boîte",
            unit_price=Decimal("1000.00"),
            active=True,
            supplier="Fournisseur test",
        )

        self.pharmacy_stock = LocationStock.objects.create(
            product=self.product,
            location=self.pharmacy,
            quantity=20,
        )

        self.first_batch = ProductBatch.objects.create(
            product=self.product,
            location=self.pharmacy,
            batch_number="LOT-SALE-FIRST",
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
            location=self.pharmacy,
            batch_number="LOT-SALE-SECOND",
            quantity=15,
            expiration_date=(
                timezone.localdate()
                + timedelta(days=60)
            ),
            supplier="Fournisseur test",
            active=True,
        )

        self.sale_url = reverse("sale-list")

    def sale_payload(self, quantity=8):
        return {
            "pharmacy": self.pharmacy.id,
            "customer_name": "Patient test",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": quantity,
                }
            ],
        }

    def test_sale_updates_all_stocks_using_fefo(self):
        response = self.client.post(
            self.sale_url,
            self.sale_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.product.refresh_from_db()
        self.pharmacy_stock.refresh_from_db()
        self.first_batch.refresh_from_db()
        self.second_batch.refresh_from_db()

        self.assertEqual(self.product.stock, 22)
        self.assertEqual(self.pharmacy_stock.quantity, 12)

        self.assertEqual(self.first_batch.quantity, 0)
        self.assertFalse(self.first_batch.active)
        self.assertEqual(self.second_batch.quantity, 12)
        self.assertTrue(self.second_batch.active)

        sale = Sale.objects.get()
        sale_item = SaleItem.objects.get(sale=sale)

        self.assertEqual(sale.sold_by, self.user)
        self.assertEqual(
            sale.total_amount,
            Decimal("8000.00"),
        )
        self.assertEqual(sale_item.quantity, 8)
        self.assertEqual(
            sale_item.unit_price,
            Decimal("1000.00"),
        )
        self.assertEqual(
            sale_item.subtotal,
            Decimal("8000.00"),
        )

        usages = list(
            sale_item.batch_usages.order_by(
                "batch__expiration_date"
            )
        )

        self.assertEqual(len(usages), 2)
        self.assertEqual(usages[0].batch, self.first_batch)
        self.assertEqual(usages[0].quantity, 5)
        self.assertEqual(usages[1].batch, self.second_batch)
        self.assertEqual(usages[1].quantity, 3)

    def test_sale_with_insufficient_batches_changes_nothing(self):
        self.second_batch.quantity = 2
        self.second_batch.save(
            update_fields=[
                "quantity",
                "updated_at",
            ]
        )

        response = self.client.post(
            self.sale_url,
            self.sale_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn(
            "Stock insuffisant dans les lots",
            str(response.data["items"]),
        )

        self.product.refresh_from_db()
        self.pharmacy_stock.refresh_from_db()
        self.first_batch.refresh_from_db()
        self.second_batch.refresh_from_db()

        self.assertEqual(self.product.stock, 30)
        self.assertEqual(self.pharmacy_stock.quantity, 20)
        self.assertEqual(self.first_batch.quantity, 5)
        self.assertTrue(self.first_batch.active)
        self.assertEqual(self.second_batch.quantity, 2)
        self.assertTrue(self.second_batch.active)

        self.assertFalse(Sale.objects.exists())
        self.assertFalse(SaleItem.objects.exists())
        self.assertFalse(SaleItemBatch.objects.exists())

    def test_sale_with_insufficient_global_stock_changes_nothing(self):
        self.product.stock = 5
        self.product.save(
            update_fields=[
                "stock",
                "updated_at",
            ]
        )

        response = self.client.post(
            self.sale_url,
            self.sale_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn(
            "Stock global insuffisant",
            str(response.data["items"]),
        )

        self.product.refresh_from_db()
        self.pharmacy_stock.refresh_from_db()
        self.first_batch.refresh_from_db()
        self.second_batch.refresh_from_db()

        self.assertEqual(self.product.stock, 5)
        self.assertEqual(self.pharmacy_stock.quantity, 20)
        self.assertEqual(self.first_batch.quantity, 5)
        self.assertEqual(self.second_batch.quantity, 15)

        self.assertFalse(Sale.objects.exists())
        self.assertFalse(SaleItem.objects.exists())
        self.assertFalse(SaleItemBatch.objects.exists())

    def test_sale_rejects_duplicate_product(self):
        payload = self.sale_payload(quantity=3)
        payload["items"].append(
            {
                "product": self.product.id,
                "quantity": 2,
            }
        )

        response = self.client.post(
            self.sale_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn(
            "ne peut apparaître qu'une seule fois",
            str(response.data["items"]),
        )

        self.product.refresh_from_db()
        self.pharmacy_stock.refresh_from_db()
        self.first_batch.refresh_from_db()
        self.second_batch.refresh_from_db()

        self.assertEqual(self.product.stock, 30)
        self.assertEqual(self.pharmacy_stock.quantity, 20)
        self.assertEqual(self.first_batch.quantity, 5)
        self.assertEqual(self.second_batch.quantity, 15)

        self.assertFalse(Sale.objects.exists())
        self.assertFalse(SaleItem.objects.exists())
        self.assertFalse(SaleItemBatch.objects.exists())

    def test_sale_generates_alert_after_commit(self):
        self.product.min_stock = 20
        self.product.save(
            update_fields=[
                "min_stock",
                "updated_at",
            ]
        )

        with self.captureOnCommitCallbacks(
            execute=True
        ):
            response = self.client.post(
                self.sale_url,
                self.sale_payload(quantity=11),
                format="json",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock,
            19,
        )

        alert = Alert.objects.get(
            product=self.product,
            alert_type="LOW_STOCK",
            is_resolved=False,
        )

        self.assertEqual(
            alert.severity,
            "WARNING",
        )
        self.assertIn(
            "stock de",
            alert.message,
        )
