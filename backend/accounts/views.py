from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import LoginSerializer, SignupSerializer, UserSerializer


class CsrfView(APIView):
    """GET /api/auth/csrf/ — sets the csrftoken cookie before the first write."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": get_token(request)})


class SignupView(APIView):
    """POST /api/auth/signup/ — create account (+ Employer when role=employer), log in."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(UserSerializer(user).data, status=201)


class LoginView(APIView):
    """POST /api/auth/login/ — start a session."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return Response(UserSerializer(user).data, status=200)


class LogoutView(APIView):
    """POST /api/auth/logout/ — end the session."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=200)


class CurrentUserView(APIView):
    """GET /api/auth/me/ — current user; 403 when anonymous (stock DRF, see §3)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
