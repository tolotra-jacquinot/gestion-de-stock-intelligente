from datetime import timedelta
from math import ceil

from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from products.models import Product
from inventory.models import SaleItem


HISTORY_DAYS = 30
RECENT_DAYS = 7


def get_product_forecast(product):
    """
    Calcule la prévision de consommation et le risque de rupture
    pour un produit donné.

    Cette première version utilise une moyenne pondérée :
        70 % de la consommation moyenne des 7 derniers jours
        30 % de la consommation moyenne des 30 derniers jours.

    Aucun modèle de Machine Learning n'est utilisé dans cette V1.
    """

    today = timezone.localdate()
    history_start = today - timedelta(days=HISTORY_DAYS - 1)
    recent_start = today - timedelta(days=RECENT_DAYS - 1)

    # ------------------------------------------------------------------
    # Consommation quotidienne sur les 30 derniers jours
    # ------------------------------------------------------------------
    daily_consumption = (
        SaleItem.objects
        .filter(
            product=product,
            sale__created_at__date__gte=history_start,
            sale__created_at__date__lte=today,
        )
        .annotate(
            day=TruncDate("sale__created_at")
        )
        .values("day")
        .annotate(
            quantity=Sum("quantity")
        )
        .order_by("day")
    )

    daily_data = {
        row["day"]: row["quantity"]
        for row in daily_consumption
    }

    # ------------------------------------------------------------------
    # Consommation totale 30 jours
    # ------------------------------------------------------------------
    consumption_30d = sum(daily_data.values())

    # ------------------------------------------------------------------
    # Moyenne quotidienne sur 30 jours
    # ------------------------------------------------------------------
    average_30d = consumption_30d / HISTORY_DAYS

    # ------------------------------------------------------------------
    # Consommation totale et moyenne sur les 7 derniers jours
    # ------------------------------------------------------------------
    consumption_7d = sum(
        quantity
        for day, quantity in daily_data.items()
        if day >= recent_start
    )

    average_7d = consumption_7d / RECENT_DAYS

    # ------------------------------------------------------------------
    # Qualité des données
    # ------------------------------------------------------------------
    days_with_sales = len(daily_data)

    if days_with_sales == 0:
        data_quality = "INSUFFICIENT"
    elif days_with_sales < 7:
        data_quality = "LIMITED"
    else:
        data_quality = "SUFFICIENT"

    # ------------------------------------------------------------------
    # Cas sans consommation
    # ------------------------------------------------------------------
    if consumption_30d == 0:
        return {
            "product_id": product.id,
            "product_code": product.code,
            "product_name": product.name,
            "stock": product.stock,
            "consumption_30d": 0,
            "consumption_7d": 0,
            "average_30d": 0,
            "average_7d": 0,
            "forecast_daily": 0,
            "estimated_autonomy_days": None,
            "estimated_stockout_date": None,
            "risk_level": "NO_DATA",
            "data_quality": data_quality,
            "days_with_sales": 0,
        }

    # ------------------------------------------------------------------
    # Prévision pondérée
    # ------------------------------------------------------------------
    forecast_daily = (
        (average_7d * 0.70)
        + (average_30d * 0.30)
    )

    # ------------------------------------------------------------------
    # Stock déjà épuisé
    # ------------------------------------------------------------------
    if product.stock <= 0:
        return {
            "product_id": product.id,
            "product_code": product.code,
            "product_name": product.name,
            "stock": product.stock,
            "consumption_30d": consumption_30d,
            "consumption_7d": consumption_7d,
            "average_30d": round(average_30d, 2),
            "average_7d": round(average_7d, 2),
            "forecast_daily": round(forecast_daily, 2),
            "estimated_autonomy_days": 0,
            "estimated_stockout_date": today,
            "risk_level": "OUT_OF_STOCK",
            "data_quality": data_quality,
            "days_with_sales": days_with_sales,
        }

    # ------------------------------------------------------------------
    # Autonomie estimée
    # ------------------------------------------------------------------
    if forecast_daily <= 0:
        autonomy_days = None
        stockout_date = None
    else:
        autonomy_days = product.stock / forecast_daily

        days_until_stockout = max(
            0,
            ceil(autonomy_days),
        )

        stockout_date = today + timedelta(
            days=days_until_stockout
        )

    # ------------------------------------------------------------------
    # Niveau de risque
    # ------------------------------------------------------------------
    if autonomy_days is None:
        risk_level = "NO_DATA"
    elif autonomy_days <= 7:
        risk_level = "HIGH"
    elif autonomy_days <= 15:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "product_id": product.id,
        "product_code": product.code,
        "product_name": product.name,
        "stock": product.stock,
        "consumption_30d": consumption_30d,
        "consumption_7d": consumption_7d,
        "average_30d": round(average_30d, 2),
        "average_7d": round(average_7d, 2),
        "forecast_daily": round(forecast_daily, 2),
        "estimated_autonomy_days": round(autonomy_days, 2)
        if autonomy_days is not None
        else None,
        "estimated_stockout_date": stockout_date,
        "risk_level": risk_level,
        "data_quality": data_quality,
        "days_with_sales": days_with_sales,
    }


def get_all_forecasts():
    """
    Retourne la prévision de tous les produits actifs.
    """

    products = Product.objects.filter(active=True).order_by("code")

    return [
        get_product_forecast(product)
        for product in products
    ]
