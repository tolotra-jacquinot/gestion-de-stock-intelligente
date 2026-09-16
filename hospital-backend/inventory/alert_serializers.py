from rest_framework import serializers

from .models import Alert


class AlertSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    batch_number = serializers.CharField(
        source="batch.batch_number",
        read_only=True,
        allow_null=True,
    )

    alert_type_display = serializers.CharField(
        source="get_alert_type_display",
        read_only=True,
    )

    severity_display = serializers.CharField(
        source="get_severity_display",
        read_only=True,
    )

    class Meta:
        model = Alert

        fields = [
            "id",
            "product",
            "product_name",
            "batch",
            "batch_number",
            "alert_type",
            "alert_type_display",
            "severity",
            "severity_display",
            "title",
            "message",
            "is_read",
            "is_resolved",
            "created_at",
            "resolved_at",
        ]

        read_only_fields = [
            "id",
            "product",
            "product_name",
            "batch",
            "batch_number",
            "alert_type",
            "alert_type_display",
            "severity",
            "severity_display",
            "title",
            "message",
            "created_at",
            "resolved_at",
        ]
