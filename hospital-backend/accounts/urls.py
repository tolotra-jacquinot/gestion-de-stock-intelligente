from django.urls import path
from .views import login, forgot_password, reset_password
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("login/", login),

    path(
        "forgot-password/",
        forgot_password
    ),

    path(
        "reset-password/<uidb64>/<token>/",
        reset_password
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
]
