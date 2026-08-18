from django.db import models

from datetime import timedelta

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Product
from .serializers import ProductSerializer


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