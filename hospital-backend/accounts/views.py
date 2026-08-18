from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers import UserSerializer
from accounts.permissions import IsAdmin


User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


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


@api_view(["POST"])
def forgot_password(request):

    email = request.data.get("email")

    try:

        user = User.objects.get(email=email)

        uid = urlsafe_base64_encode(force_bytes(user.pk))

        token = default_token_generator.make_token(user)

        reset_link = (
            f"http://localhost:3000/reset-password/{uid}/{token}"
        )

        send_mail(
            subject="Réinitialisation du mot de passe",
            message=f"Cliquez ici : {reset_link}",
            from_email="tolotrajacquinot@gmail.com",
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({
            "message": "Email envoyé"
        })

    except User.DoesNotExist:

        return Response(
            {"error": "Email introuvable"},
            status=404,
        )

    except Exception as e:

        return Response(
            {"error": str(e)},
            status=500,
        )


@api_view(["POST"])
def reset_password(request, uidb64, token):

    try:

        uid = urlsafe_base64_decode(uidb64).decode()

        user = User.objects.get(pk=uid)

        if not default_token_generator.check_token(user, token):

            return Response(
                {"error": "Lien invalide ou expiré"},
                status=400,
            )

        new_password = request.data.get("password")

        user.set_password(new_password)

        user.save()

        return Response({
            "message": "Mot de passe modifié"
        })

    except Exception as e:

        return Response(
            {"error": str(e)},
            status=400,
        )


@api_view(["GET"])
@permission_classes([IsAdmin])
def users_list(request):

    users = User.objects.all().order_by("id")

    serializer = UserSerializer(users, many=True)

    return Response(serializer.data)


class TestAuthView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": request.user.role,
            "is_authenticated": request.user.is_authenticated,
        })