from datetime import timedelta
from math import ceil

import pandas as pd
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from prophet import Prophet

from products.models import Product
from inventory.models import SaleItem


HISTORY_DAYS = 30
RECENT_DAYS = 7
PROPHET_HISTORY_DAYS = 90
PROPHET_MIN_DAYS = 28
FORECAST_HORIZON_DAYS = 7


def get_daily_consumption(product, history_days=HISTORY_DAYS):
    """
    Retourne la consommation quotidienne d'un produit
    sur la période historique demandée.
    """

    today = timezone.localdate()
    history_start = today - timedelta(days=history_days - 1)

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

    return {
        row["day"]: row["quantity"]
        for row in daily_consumption
    }


def calculate_v1_forecast(daily_data, today):
    """
    Calcule la prévision avec la méthode V1 :
    70 % de la moyenne des 7 derniers jours
    + 30 % de la moyenne des 30 derniers jours.
    """

    recent_start = today - timedelta(days=RECENT_DAYS - 1)

    consumption_30d = sum(daily_data.values())

    average_30d = (
        consumption_30d / HISTORY_DAYS
        if consumption_30d > 0
        else 0
    )

    consumption_7d = sum(
        quantity
        for day, quantity in daily_data.items()
        if day >= recent_start
    )

    average_7d = consumption_7d / RECENT_DAYS

    forecast_daily = (
        (average_7d * 0.70)
        + (average_30d * 0.30)
    )

    return {
        "consumption_30d": consumption_30d,
        "consumption_7d": consumption_7d,
        "average_30d": average_30d,
        "average_7d": average_7d,
        "forecast_daily": forecast_daily,
    }


def calculate_prophet_forecast(daily_data):
    """
    Calcule une prévision quotidienne avec Prophet.

    Prophet nécessite au minimum PROPHET_MIN_DAYS
    de jours de données avec consommation.
    """

    data = [
        {
            "ds": day,
            "y": float(quantity),
        }
        for day, quantity in sorted(daily_data.items())
    ]

    if len(data) < PROPHET_MIN_DAYS:
        raise ValueError(
            "Historique insuffisant pour Prophet."
        )

    dataframe = pd.DataFrame(data)

    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=False,
    )

    model.fit(dataframe)

    future = model.make_future_dataframe(
        periods=FORECAST_HORIZON_DAYS,
        freq="D",
    )

    forecast = model.predict(future)

    future_forecast = forecast.tail(
        FORECAST_HORIZON_DAYS
    )

    forecast_daily = float(
        future_forecast["yhat"].mean()
    )

    return max(0, forecast_daily)


def get_product_forecast(product):
    """
    Calcule la prévision de consommation et le risque de rupture.

    Stratégie :
    - Prophet si l'historique est suffisant.
    - Méthode V1 comme fallback.
    """

    today = timezone.localdate()

    daily_data = get_daily_consumption(
        product,
        history_days=HISTORY_DAYS,
    )

    prophet_data = get_daily_consumption(
        product,
        history_days=PROPHET_HISTORY_DAYS,
    )

    consumption_30d = sum(daily_data.values())

    recent_start = today - timedelta(days=RECENT_DAYS - 1)

    consumption_7d = sum(
        quantity
        for day, quantity in daily_data.items()
        if day >= recent_start
    )

    average_30d = (
        consumption_30d / HISTORY_DAYS
        if consumption_30d > 0
        else 0
    )

    average_7d = consumption_7d / RECENT_DAYS

    days_with_sales = len(prophet_data)

    # --------------------------------------------------------------
    # Qualité des données
    # --------------------------------------------------------------

    if days_with_sales == 0:
        data_quality = "INSUFFICIENT"
    elif days_with_sales < 7:
        data_quality = "LIMITED"
    elif days_with_sales < PROPHET_MIN_DAYS:
        data_quality = "LIMITED"
    else:
        data_quality = "SUFFICIENT"

    # --------------------------------------------------------------
    # Aucun historique de consommation
    # --------------------------------------------------------------

    if days_with_sales == 0:
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
            "forecast_method": "NONE",
            "data_quality": data_quality,
            "days_with_sales": days_with_sales,
        }

    # --------------------------------------------------------------
    # Prévision
    # --------------------------------------------------------------

    v1_forecast = calculate_v1_forecast(
        daily_data,
        today,
    )

    forecast_method = "V1"

    # Utiliser l'historique disponible si la consommation
    # des 30 derniers jours est nulle.
    if v1_forecast["forecast_daily"] <= 0 and prophet_data:
        historical_days = len(prophet_data)
        historical_consumption = sum(prophet_data.values())

        if historical_days > 0 and historical_consumption > 0:
            forecast_daily = historical_consumption / historical_days
        else:
            forecast_daily = v1_forecast["forecast_daily"]
    else:
        forecast_daily = v1_forecast["forecast_daily"]

    if len(prophet_data) >= PROPHET_MIN_DAYS:
        try:
            forecast_daily = calculate_prophet_forecast(
                prophet_data
            )
            forecast_method = "PROPHET"
        except Exception:
            forecast_method = "V1"
    else:
        forecast_method = "V1"

    # --------------------------------------------------------------
    # Stock déjà épuisé
    # --------------------------------------------------------------

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
            "forecast_method": forecast_method,
            "data_quality": data_quality,
            "days_with_sales": days_with_sales,
        }

    # --------------------------------------------------------------
    # Autonomie
    # --------------------------------------------------------------

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

    # --------------------------------------------------------------
    # Niveau de risque
    # --------------------------------------------------------------

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
        "estimated_autonomy_days": (
            round(autonomy_days, 2)
            if autonomy_days is not None
            else None
        ),
        "estimated_stockout_date": stockout_date,
        "risk_level": risk_level,
        "forecast_method": forecast_method,
        "data_quality": data_quality,
        "days_with_sales": days_with_sales,
    }


def get_all_forecasts():
    """
    Retourne la prévision de tous les produits actifs.
    """

    products = (
        Product.objects
        .filter(active=True)
        .order_by("code")
    )

    return [
        get_product_forecast(product)
        for product in products
    ]