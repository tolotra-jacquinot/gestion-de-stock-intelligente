from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentification
    path("api/auth/", include("accounts.urls")),

    # Produits
    path("api/", include("products.urls")),

    path("api/", include("inventory.urls")),
]