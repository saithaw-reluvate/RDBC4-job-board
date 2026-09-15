from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models import Employer, User


class EmployerSerializer(serializers.ModelSerializer):
    contactEmail = serializers.EmailField(source="contact_email", read_only=True)

    class Meta:
        model = Employer
        fields = ["id", "name", "contactEmail"]


class UserSerializer(serializers.ModelSerializer):
    """The shared shape returned by signup, login, and me (docs/BACKEND.md §4)."""

    name = serializers.CharField(source="full_name", read_only=True)
    employer = EmployerSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "email", "role", "employer"]


class SignupSerializer(serializers.Serializer):
    """
    Creates a User (plus an Employer when role == employer) in one transaction.
    `companyName` is required for employers and rejected for seekers, so a
    seeker can never end up with an Employer row and vice versa (docs/BACKEND.md §6).
    """

    name = serializers.CharField(max_length=150, source="full_name")
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    role = serializers.ChoiceField(choices=User.Role.choices)
    companyName = serializers.CharField(
        max_length=200, source="company_name", required=False, allow_blank=True
    )

    def validate_email(self, value):
        normalised = value.strip().lower()
        if User.objects.filter(email=normalised).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalised

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        role = attrs.get("role")
        company_name = attrs.get("company_name", "")

        if role == User.Role.EMPLOYER and not company_name.strip():
            raise serializers.ValidationError(
                {"companyName": "Company name is required for an employer account."}
            )
        if role == User.Role.SEEKER and company_name.strip():
            raise serializers.ValidationError(
                {"companyName": "Company name is not applicable for a seeker account."}
            )
        return attrs

    def save(self):
        validated = self.validated_data
        company_name = validated.pop("company_name", "")

        user = User.objects.create_user(
            email=validated["email"],
            password=validated["password"],
            full_name=validated["full_name"],
            role=validated["role"],
        )

        if validated["role"] == User.Role.EMPLOYER:
            Employer.objects.create(
                user=user, name=company_name.strip(), contact_email=user.email
            )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(
            self.context["request"],
            email=attrs["email"].strip().lower(),
            password=attrs["password"],
        )
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs
