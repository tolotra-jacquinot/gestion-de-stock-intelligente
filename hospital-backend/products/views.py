from datetime import timedelta

from django.db import models
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Product
from .serializers import ProductSerializer

from inventory.models import SaleItem, StockMovement


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_alerts(request):
    today = timezone.now().date()
    warning_date = today + timedelta(days=30)

    out_of_stock = Product.objects.filter(
        active=True,
        stock=0,
    )

    critical_stock = Product.objects.filter(
        active=True,
        stock__gt=0,
        stock__lte=models.F("min_stock"),
    )

    expired = Product.objects.filter(
        active=True,
        expiration__lt=today,
    )

    expiring_soon = Product.objects.filter(
        active=True,
        expiration__gte=today,
        expiration__lte=warning_date,
    )

    data = {
        "out_of_stock": ProductSerializer(out_of_stock, many=True).data,
        "critical_stock": ProductSerializer(critical_stock, many=True).data,
        "expired": ProductSerializer(expired, many=True).data,
        "expiring_soon": ProductSerializer(expiring_soon, many=True).data,
    }

    return Response(data, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    today = timezone.now().date()
    warning_date = today + timedelta(days=30)

    total_products = Product.objects.filter(active=True).count()

    out_of_stock = Product.objects.filter(
        active=True,
        stock=0,
    ).count()

    critical_stock = Product.objects.filter(
        active=True,
        stock__gt=0,
        stock__lte=models.F("min_stock"),
    ).count()

    expired = Product.objects.filter(
        active=True,
        expiration__lt=today,
    ).count()

    expiring_soon = Product.objects.filter(
        active=True,
        expiration__gte=today,
        expiration__lte=warning_date,
    ).count()

    recent_movements = StockMovement.objects.order_by(
        "-created_at"
    )[:10]

    recent_movements_data = [
        {
            "id": movement.id,
            "product": movement.product.name,
            "movement_type": movement.movement_type,
            "quantity": movement.quantity,
            "user": movement.user.username,
            "created_at": movement.created_at,
        }
        for movement in recent_movements
    ]

    data = {
        "total_products": total_products,
        "out_of_stock": out_of_stock,
        "critical_stock": critical_stock,
        "expired": expired,
        "expiring_soon": expiring_soon,
        "recent_movements": recent_movements_data,
    }

    return Response(data, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def consumption_analysis(request):
    today = timezone.localdate()

    start_7_days = today - timedelta(days=6)
    start_30_days = today - timedelta(days=29)

    products = Product.objects.filter(
        active=True
    ).order_by("name")

    data = []

    for product in products:
        consumption_7_days = (
            SaleItem.objects
            .filter(
                product=product,
                sale__created_at__date__gte=start_7_days,
                sale__created_at__date__lte=today,
            )
            .aggregate(total=Sum("quantity"))
            ["total"]
            or 0
        )

        consumption_30_days = (
            SaleItem.objects
            .filter(
                product=product,
                sale__created_at__date__gte=start_30_days,
                sale__created_at__date__lte=today,
            )
            .aggregate(total=Sum("quantity"))
            ["total"]
            or 0
        )

        average_daily_consumption = (
            consumption_30_days / 30
            if consumption_30_days > 0
            else 0
        )

        if average_daily_consumption > 0:
            estimated_autonomy_days = (
                product.stock / average_daily_consumption
            )
        else:
            estimated_autonomy_days = None

        if product.stock == 0:
            risk_level = "OUT_OF_STOCK"
        elif estimated_autonomy_days is None:
            risk_level = "NO_DATA"
        elif estimated_autonomy_days <= 7:
            risk_level = "HIGH"
        elif estimated_autonomy_days <= 15:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        data.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "current_stock": product.stock,
                "consumption_7_days": consumption_7_days,
                "consumption_30_days": consumption_30_days,
                "average_daily_consumption": round(
                    average_daily_consumption,
                    2,
                ),
                "estimated_autonomy_days": (
                    round(
                        estimated_autonomy_days,
                        2,
                    )
                    if estimated_autonomy_days is not None
                    else None
                ),
                "risk_level": risk_level,
            }
        )

    return Response(
        data,
        status=status.HTTP_200_OK,
    )
