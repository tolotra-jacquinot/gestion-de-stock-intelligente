from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from inventory.models import Alert, ProductBatch
from inventory.services.forecast_service import get_product_forecast


EXPIRATION_WARNING_DAYS = 30


def create_or_update_alert(
    product,
    alert_type,
    severity,
    title,
    message,
    batch=None,
):
    """
    Crée une alerte active si elle n'existe pas déjà.

    Si une alerte active identique existe, elle est conservée
    afin d'éviter la création de doublons.
    """

    filters = {
        "product": product,
        "alert_type": alert_type,
        "is_resolved": False,
    }

    if batch is not None:
        filters["batch"] = batch
    else:
        filters["batch__isnull"] = True

    alert, created = Alert.objects.get_or_create(
        **filters,
        defaults={
            "severity": severity,
            "title": title,
            "message": message,
        },
    )

    if not created:
        updated_fields = []

        if alert.severity != severity:
            alert.severity = severity
            updated_fields.append("severity")

        if alert.title != title:
            alert.title = title
            updated_fields.append("title")

        if alert.message != message:
            alert.message = message
            updated_fields.append("message")

        if updated_fields:
            alert.save(update_fields=updated_fields)

    return alert, created


def resolve_alert(
    product,
    alert_type,
    batch=None,
):
    """
    Résout les alertes actives correspondant au produit,
    au type et éventuellement au lot.
    """

    filters = {
        "product": product,
        "alert_type": alert_type,
        "is_resolved": False,
    }

    if batch is not None:
        filters["batch"] = batch
    else:
        filters["batch__isnull"] = True

    updated = (
        Alert.objects
        .filter(**filters)
        .update(
            is_resolved=True,
            resolved_at=timezone.now(),
        )
    )

    return updated


def schedule_product_alerts(product_id):
    """
    Programme la génération des alertes après le commit
    de la transaction courante.
    """

    def generate_alerts_after_commit():
        from products.models import Product

        product = Product.objects.get(pk=product_id)
        generate_product_alerts(product)

    transaction.on_commit(
        generate_alerts_after_commit
    )


@transaction.atomic
def generate_product_alerts(product):
    """
    Évalue l'état actuel d'un produit et génère ou résout
    ses alertes intelligentes.
    """

    alerts = []

    # ---------------------------------------------------------------
    # 1. STOCK ÉPUISÉ
    # ---------------------------------------------------------------

    if product.stock <= 0:
        alert, _ = create_or_update_alert(
            product=product,
            alert_type="OUT_OF_STOCK",
            severity="CRITICAL",
            title="Rupture de stock",
            message=(
                f"Le produit {product.name} est actuellement "
                "en rupture de stock."
            ),
        )
        alerts.append(alert)
    else:
        resolve_alert(
            product=product,
            alert_type="OUT_OF_STOCK",
        )

    # ---------------------------------------------------------------
    # 2. STOCK FAIBLE
    # ---------------------------------------------------------------

    if 0 < product.stock <= product.min_stock:
        alert, _ = create_or_update_alert(
            product=product,
            alert_type="LOW_STOCK",
            severity="WARNING",
            title="Stock faible",
            message=(
                f"Le stock de {product.name} est de "
                f"{product.stock} unité(s), soit au niveau "
                f"minimum défini de {product.min_stock}."
            ),
        )
        alerts.append(alert)
    else:
        resolve_alert(
            product=product,
            alert_type="LOW_STOCK",
        )

    # ---------------------------------------------------------------
    # 3. RISQUE DE RUPTURE PRÉVISIONNEL
    # ---------------------------------------------------------------

    forecast = get_product_forecast(product)

    if forecast["risk_level"] == "HIGH":
        autonomy = forecast["estimated_autonomy_days"]

        alert, _ = create_or_update_alert(
            product=product,
            alert_type="STOCKOUT_RISK",
            severity="CRITICAL",
            title="Risque élevé de rupture",
            message=(
                f"La consommation prévue indique une rupture "
                f"possible dans environ {autonomy} jour(s)."
            ),
        )
        alerts.append(alert)
    else:
        resolve_alert(
            product=product,
            alert_type="STOCKOUT_RISK",
        )

    # ---------------------------------------------------------------
    # 4. EXPIRATION PROCHAINE DES LOTS
    # ---------------------------------------------------------------

    today = timezone.localdate()
    expiration_limit = today + timedelta(
        days=EXPIRATION_WARNING_DAYS
    )

    expiring_batches = (
        ProductBatch.objects
        .filter(
            product=product,
            active=True,
            quantity__gt=0,
            expiration_date__gte=today,
            expiration_date__lte=expiration_limit,
        )
        .order_by("expiration_date")
    )

    active_expiring_batch_ids = set()

    for batch in expiring_batches:
        active_expiring_batch_ids.add(batch.id)

        days_remaining = (
            batch.expiration_date - today
        ).days

        alert, _ = create_or_update_alert(
            product=product,
            batch=batch,
            alert_type="EXPIRING_SOON",
            severity="WARNING",
            title="Expiration prochaine",
            message=(
                f"Le lot {batch.batch_number} de {product.name} "
                f"expire dans {days_remaining} jour(s), "
                f"le {batch.expiration_date}."
            ),
        )
        alerts.append(alert)

    # Résoudre les alertes d'expiration qui ne sont plus valides.
    (
        Alert.objects
        .filter(
            product=product,
            alert_type="EXPIRING_SOON",
            is_resolved=False,
        )
        .exclude(
            batch_id__in=active_expiring_batch_ids
        )
        .update(
            is_resolved=True,
            resolved_at=timezone.now(),
        )
    )

    return alerts


@transaction.atomic
def generate_all_alerts():
    """
    Génère les alertes intelligentes pour tous les produits actifs.
    """

    from products.models import Product

    products = (
        Product.objects
        .filter(active=True)
        .order_by("code")
    )

    results = []

    for product in products:
        results.extend(
            generate_product_alerts(product)
        )

    return results
