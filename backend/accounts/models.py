import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    """Creates users by email — there is no username field."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """
        No full_clean() here: uniqueness and format validation is the API
        layer's job (serializers, docs/BACKEND.md §6). The manager relies on
        the DB's unique constraint, which raises IntegrityError on collision —
        the model layer's own contract, independent of how the API surfaces it.
        """
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user, keyed by email. `full_name` is the person; `Employer.name` is
    the company — the two are never conflated (docs/BACKEND.md §3).
    """

    class Role(models.TextChoices):
        SEEKER = "seeker", "Seeker"
        EMPLOYER = "employer", "Employer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.SEEKER)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        ordering = ["-date_joined", "-id"]

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # Emails are normalised to lowercase in full (not just the domain, as
        # Django's own normalize_email does) so uniqueness is genuinely
        # case-insensitive, as docs/BACKEND.md §6 requires.
        self.email = self.email.strip().lower()
        super().save(*args, **kwargs)


class Employer(models.Model):
    """
    A company profile, 1:1 with a `User` whose role is `employer`.
    `name` is the company — the `employerName` the frontend displays.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="employer"
    )
    name = models.CharField(max_length=200)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=40, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.name
