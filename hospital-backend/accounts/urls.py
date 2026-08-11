from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    login,
    forgot_password,
    reset_password,
    users_list_create,
    user_detail,
)

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

    path(
        "users/",
        users_list_create,
        name="users_list_create",
    ),

    path(
        "users/<int:user_id>/",
        user_detail,
        name="user_detail",
    ),
]
