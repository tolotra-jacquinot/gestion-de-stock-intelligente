from rest_framework.permissions import BasePermission, SAFE_METHODS


class StockMovementPermission(BasePermission):
    """
    Permissions des mouvements de stock :

    - Admin : accès complet
    - Magasinier : accès complet
    - Pharmacien : lecture seule
    - Directeur : lecture seule
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        return request.user.role in ["admin", "magasinier"]