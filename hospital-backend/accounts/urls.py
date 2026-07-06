from django.urls import path
from .views import login, forgot_password, reset_password

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
]
