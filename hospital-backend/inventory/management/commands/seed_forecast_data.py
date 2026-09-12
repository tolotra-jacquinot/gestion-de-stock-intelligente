from datetime import datetime, time, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from inventory.models import (
    LocationStock,
    Product,
    ProductBatch,
    SaleItem,
    SaleItemBatch,
    StockLocation,
    StockMovement,
    StockTransfer,
)
from inventory.serializers import SaleSerializer, StockTransferSerializer


class Command(BaseCommand):
    help = "Crée un jeu de données historique propre pour tester la prévision de rupture."

    def handle(self, *args, **options):
        with transaction.atomic():
            self.seed()

        self.stdout.write(
            self.style.SUCCESS(
                "\nJeu de données de prévision créé avec succès."
            )
        )

    def seed(self):
        # ------------------------------------------------------------------
        # 1. Vérifications de sécurité
        # ------------------------------------------------------------------
        if Product.objects.exists() or SaleItem.objects.exists():
            raise CommandError(
                "La base contient déjà des produits ou des ventes. "
                "Le seed est prévu pour une base nettoyée."
            )

        pharmacy = StockLocation.objects.filter(
            location_type="PHARMACY",
            active=True,
        ).first()

        store = StockLocation.objects.filter(
            location_type="STORE",
            active=True,
        ).first()

        pharmacist = User.objects.filter(
            role="pharmacien",
            is_active=True,
        ).order_by("id").first()

        storekeeper = User.objects.filter(
            role="magasinier",
            is_active=True,
        ).order_by("id").first()

        if not pharmacy:
            raise CommandError("Aucune pharmacie active trouvée.")

        if not store:
            raise CommandError("Aucun magasin central actif trouvé.")

        if not pharmacist:
            raise CommandError("Aucun utilisateur pharmacien actif trouvé.")

        if not storekeeper:
            raise CommandError("Aucun utilisateur magasinier actif trouvé.")

        # ------------------------------------------------------------------
        # 2. Période historique : 30 jours
        # ------------------------------------------------------------------
        today = timezone.localdate()
        start_date = today - timedelta(days=29)

        self.stdout.write(
            f"Période historique : {start_date} -> {today}"
        )

        # ------------------------------------------------------------------
        # 3. Produits et profils de consommation
        # ------------------------------------------------------------------
        products_data = [
            {
                "code": "MED001",
                "name": "Paracétamol 500 mg",
                "category": "Médicaments",
                "unit_price": 500,
                "min_stock": 50,
                "max_stock": 500,
                "target_stock": 120,
                "profile": "stable",
            },
            {
                "code": "MED002",
                "name": "Amoxicilline 500 mg",
                "category": "Médicaments",
                "unit_price": 1200,
                "min_stock": 40,
                "max_stock": 400,
                "target_stock": 70,
                "profile": "increasing",
            },
            {
                "code": "MED003",
                "name": "Ibuprofène 400 mg",
                "category": "Médicaments",
                "unit_price": 800,
                "min_stock": 100,
                "max_stock": 600,
                "target_stock": 400,
                "profile": "stable_medium",
            },
            {
                "code": "MED004",
                "name": "Métronidazole 500 mg",
                "category": "Médicaments",
                "unit_price": 700,
                "min_stock": 50,
                "max_stock": 400,
                "target_stock": 100,
                "profile": "increasing_medium",
            },
            {
                "code": "MED005",
                "name": "Ceftriaxone 1 g",
                "category": "Médicaments",
                "unit_price": 3500,
                "min_stock": 50,
                "max_stock": 600,
                "target_stock": 500,
                "profile": "low",
            },
            {
                "code": "SOL001",
                "name": "Sérum physiologique 500 ml",
                "category": "Solutés",
                "unit_price": 2000,
                "min_stock": 100,
                "max_stock": 1000,
                "target_stock": 100,
                "profile": "very_high",
            },
            {
                "code": "MED006",
                "name": "Vitamine C 500 mg",
                "category": "Médicaments",
                "unit_price": 600,
                "min_stock": 100,
                "max_stock": 600,
                "target_stock": 300,
                "profile": "decreasing",
            },
            {
                "code": "MED007",
                "name": "Oméprazole 20 mg",
                "category": "Médicaments",
                "unit_price": 900,
                "min_stock": 80,
                "max_stock": 500,
                "target_stock": 180,
                "profile": "irregular",
            },
            {
                "code": "MED008",
                "name": "Diazépam 5 mg",
                "category": "Médicaments",
                "unit_price": 400,
                "min_stock": 30,
                "max_stock": 300,
                "target_stock": 100,
                "profile": "no_data",
            },
            {
                "code": "MED009",
                "name": "Produit récent",
                "category": "Médicaments",
                "unit_price": 1000,
                "min_stock": 30,
                "max_stock": 300,
                "target_stock": 30,
                "profile": "limited",
            },
        ]

        profiles = {
            "stable": (
                [8] * 7
                + [10] * 8
                + [10] * 7
                + [11] * 8
            ),
            "increasing": (
                [3] * 7
                + [5] * 8
                + [8] * 7
                + [12] * 8
            ),
            "stable_medium": (
                [5] * 7
                + [6] * 8
                + [5] * 7
                + [6] * 8
            ),
            "increasing_medium": (
                [3] * 7
                + [4] * 8
                + [6] * 7
                + [8] * 8
            ),
            "low": (
                [0, 1, 0, 2, 0, 1, 0]
                + [1, 0, 2, 0, 1, 0, 0, 1]
                + [0, 1, 0, 2, 0, 0, 1]
                + [1, 0, 1, 0, 2, 0, 1, 0]
            ),
            "very_high": (
                [15] * 7
                + [18] * 8
                + [20] * 7
                + [22] * 8
            ),
            "decreasing": (
                [12] * 7
                + [9] * 8
                + [6] * 7
                + [3] * 8
            ),
            "irregular": [
                2, 8, 3, 12, 0, 6, 15,
                4, 1, 10, 5, 13, 2, 9, 0,
                7, 14, 3, 6, 11, 2, 8,
                4, 16, 1, 7, 12, 3, 9, 5,
            ],
            "no_data": [0] * 30,
            "limited": [0] * 26 + [5, 0, 8, 4],
        }

        # ------------------------------------------------------------------
        # 4. Vérification des profils
        # ------------------------------------------------------------------
        for profile_name, quantities in profiles.items():
            if len(quantities) != 30:
                raise CommandError(
                    f"Le profil '{profile_name}' ne contient pas 30 jours."
                )

        # ------------------------------------------------------------------
        # 5. Création des produits et du stock initial
        # ------------------------------------------------------------------
        for data in products_data:
            consumption = profiles[data["profile"]]
            total_consumption = sum(consumption)
            initial_stock = data["target_stock"] + total_consumption

            product = Product.objects.create(
                name=data["name"],
                code=data["code"],
                category=data["category"],
                stock=initial_stock,
                min_stock=data["min_stock"],
                max_stock=data["max_stock"],
                expiration=today + timedelta(days=365),
                location=pharmacy.name,
                packaging="Boîte",
                unit_price=data["unit_price"],
                active=True,
                supplier="Pharma Madagascar",
            )

            # Stock initial entièrement placé au magasin central.
            LocationStock.objects.create(
                product=product,
                location=store,
                quantity=initial_stock,
            )

            LocationStock.objects.create(
                product=product,
                location=pharmacy,
                quantity=0,
            )

            # Deux lots afin de tester le fonctionnement FEFO.
            first_batch_quantity = initial_stock // 2
            second_batch_quantity = (
                initial_stock - first_batch_quantity
            )

            ProductBatch.objects.create(
                product=product,
                location=store,
                batch_number=f"{data['code']}-LOT-A",
                quantity=first_batch_quantity,
                expiration_date=today + timedelta(days=240),
                supplier="Pharma Madagascar",
                active=True,
            )

            ProductBatch.objects.create(
                product=product,
                location=store,
                batch_number=f"{data['code']}-LOT-B",
                quantity=second_batch_quantity,
                expiration_date=today + timedelta(days=420),
                supplier="Sante Distribution",
                active=True,
            )

            # Mouvement d'entrée correspondant au stock initial.
            initial_datetime = self.make_datetime(
                start_date,
                hour=8,
            )

            movement = StockMovement.objects.create(
                product=product,
                user=storekeeper,
                movement_type="ENTRY",
                quantity=initial_stock,
                reason="Réception initiale du jeu de données de prévision",
            )

            StockMovement.objects.filter(
                pk=movement.pk
            ).update(created_at=initial_datetime)

            # ------------------------------------------------------------------
            # 6. Transfert réel magasin -> pharmacie
            # ------------------------------------------------------------------
            transfer_serializer = StockTransferSerializer(
                data={
                    "product": product.id,
                    "source": store.id,
                    "destination": pharmacy.id,
                    "quantity": initial_stock,
                    "reason": "Approvisionnement initial de la pharmacie",
                }
            )

            transfer_serializer.is_valid(raise_exception=True)

            transfer = transfer_serializer.save(
                transferred_by=storekeeper
            )

            StockTransfer.objects.filter(
                pk=transfer.pk
            ).update(
                created_at=self.make_datetime(
                    start_date,
                    hour=9,
                )
            )

            # ------------------------------------------------------------------
            # 7. Création des ventes historiques via le vrai serializer
            # ------------------------------------------------------------------
            for day_index, quantity in enumerate(consumption):
                if quantity <= 0:
                    continue

                sale_date = start_date + timedelta(days=day_index)

                sale_serializer = SaleSerializer(
                    data={
                        "pharmacy": pharmacy.id,
                        "customer_name": "Patient de test",
                        "items": [
                            {
                                "product": product.id,
                                "quantity": quantity,
                            }
                        ],
                    }
                )

                sale_serializer.is_valid(raise_exception=True)

                sale = sale_serializer.save(
                    sold_by=pharmacist
                )

                historical_datetime = self.make_datetime(
                    sale_date,
                    hour=10,
                )

                SaleItem.objects.filter(
                    sale_id=sale.pk
                ).update(
                    created_at=historical_datetime
                )

                sale_item_ids = SaleItem.objects.filter(
                    sale_id=sale.pk
                ).values_list("id", flat=True)

                SaleItemBatch.objects.filter(
                    sale_item_id__in=sale_item_ids
                ).update(
                    created_at=historical_datetime
                )

                sale.__class__.objects.filter(
                    pk=sale.pk
                ).update(
                    created_at=historical_datetime
                )

            # ------------------------------------------------------------------
            # 8. Vérification du stock final
            # ------------------------------------------------------------------
            product.refresh_from_db()

            pharmacy_stock = LocationStock.objects.get(
                product=product,
                location=pharmacy,
            )

            store_stock = LocationStock.objects.get(
                product=product,
                location=store,
            )

            if product.stock != data["target_stock"]:
                raise CommandError(
                    f"Stock global incorrect pour {product.code}: "
                    f"{product.stock} au lieu de {data['target_stock']}."
                )

            if pharmacy_stock.quantity != data["target_stock"]:
                raise CommandError(
                    f"Stock pharmacie incorrect pour {product.code}: "
                    f"{pharmacy_stock.quantity} au lieu de "
                    f"{data['target_stock']}."
                )

            if store_stock.quantity != 0:
                raise CommandError(
                    f"Le stock magasin de {product.code} "
                    f"devrait être à 0."
                )

            self.stdout.write(
                f"  ✓ {product.code} | "
                f"consommation={total_consumption} | "
                f"stock final={product.stock} | "
                f"profil={data['profile']}"
            )

        # ------------------------------------------------------------------
        # 9. Résumé final
        # ------------------------------------------------------------------
        self.stdout.write("")
        self.stdout.write(
            f"Produits       : {Product.objects.count()}"
        )
        self.stdout.write(
            f"Ventes         : {SaleItem.objects.values('sale').distinct().count()}"
        )
        self.stdout.write(
            f"Lignes de vente: {SaleItem.objects.count()}"
        )
        self.stdout.write(
            f"Lots           : {ProductBatch.objects.count()}"
        )
        self.stdout.write(
            f"Transferts     : {StockTransfer.objects.count()}"
        )
        self.stdout.write(
            f"Mouvements     : {StockMovement.objects.count()}"
        )

    @staticmethod
    def make_datetime(date_value, hour=10):
        naive_datetime = datetime.combine(
            date_value,
            time(hour=hour, minute=0),
        )
        return timezone.make_aware(
            naive_datetime,
            timezone.get_current_timezone(),
        )
