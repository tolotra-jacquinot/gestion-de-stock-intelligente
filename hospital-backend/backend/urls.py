from django.contrib import admin
from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

urlpatterns = [

    path(
        'admin/',
        admin.site.urls
    ),

    path(
        'api/login/',
        TokenObtainPairView.as_view(),
        name='login'
    ),

    path(
        'api/refresh/',
        TokenRefreshView.as_view(),
        name='refresh'
    ),

]
