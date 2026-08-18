from rest_framework import status
from rest_framework.decorators import api_view, permission_classes

from .serializers import UserSerializer
from .permissions import IsAdmin

from django.contrib.auth import authenticate, get_user_model
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)
from django.utils.encoding import force_bytes
from django.conf import settings

User = get_user_model()


@api_view(["POST"])
def forgot_password(request):

    print("DONNEES :", request.data)

    email = request.data.get("email")

    print("EMAIL :", email)

    try:
        user = User.objects.get(email=email)

        uid = urlsafe_base64_encode(force_bytes(user.pk))

        token = default_token_generator.make_token(user)

        reset_link = f"http://localhost:3000/reset-password/{uid}/{token}"

        print("LIEN :", reset_link)

        send_mail(
            subject="Réinitialisation du mot de passe",
            message=f"Cliquez ici : {reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({"message": "Email envoyé"})

    except User.DoesNotExist:
        return Response({"error": "Email introuvable"}, status=404)

    except Exception as e:
        print(e)
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def reset_password(request, uidb64, token):

    try:
        uid = urlsafe_base64_decode(uidb64).decode()

        print("UID :", uid)

        user = User.objects.get(pk=uid)

        print("USER :", user.username)
        print("TOKEN :", token)

        valid = default_token_generator.check_token(user, token)

        print("TOKEN VALIDE :", valid)

        if not valid:
            return Response(
                {"error": "Lien invalide ou expiré"},
                status=400,
            )

        new_password = request.data.get("password")

        user.set_password(new_password)

        user.save()

        return Response(
            {"message": "Mot de passe modifié"}
        )

    except Exception as e:
        print(e)
        return Response(
            {"error": str(e)},
            status=400,
        )


@api_view(["POST"])
def login(request):

    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(
        username=username,
        password=password,
    )

    if user:

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "token": str(refresh.access_token),
                "refresh": str(refresh),
                "username": user.username,
                "role": user.role,
            }
        )

    return Response(
        {"error": "Identifiants invalides"},
        status=401,
    )

@api_view(["GET", "POST"])
@permission_classes([IsAdmin])
def users_list_create(request):
    if request.method == "GET":
        users = User.objects.all().order_by("-date_joined")
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    username = request.data.get("username")
    email = request.data.get("email")
    role = request.data.get("role")
    password = request.data.get("password")

    if not username or not password or not role:
        return Response(
            {
                "error": "username, password et role sont obligatoires"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Ce nom d'utilisateur existe déjà"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email or "",
        password=password,
        role=role,
    )

    return Response(
        UserSerializer(user).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAdmin])
def user_detail(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "Utilisateur introuvable"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "PATCH":
        role = request.data.get("role")

        if role:
            valid_roles = [
                choice[0]
                for choice in User.ROLE_CHOICES
            ]

            if role not in valid_roles:
                return Response(
                    {"error": "Rôle invalide"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.role = role
            user.save(update_fields=["role"])

        return Response(UserSerializer(user).data)

    if request.method == "DELETE":
        if user == request.user:
            return Response(
                {
                    "error": "Vous ne pouvez pas supprimer votre propre compte."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )