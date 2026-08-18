from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsPharmacien(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "pharmacien"
        )


class IsMagasinier(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "magasinier"
        )


class IsDirecteur(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "directeur"
        )


class IsAdminOrMagasinier(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in [
                "admin",
                "magasinier",
            ]
        )


class IsConnected(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated