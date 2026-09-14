from rest_framework import viewsets

from accounts.permissions import IsConnected

from .alert_serializers import AlertSerializer
from .models import Alert


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.select_related(
        "product",
        "batch",
    ).all()

    serializer_class = AlertSerializer
    permission_classes = [IsConnected]

    http_method_names = [
        "get",
        "patch",
        "head",
        "options",
    ]
