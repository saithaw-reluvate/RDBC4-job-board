"""
Group 1 — accounts models (docs/BACKEND.md §8 group 1).
"""
import pytest
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError

from accounts.models import Employer, User


@pytest.mark.django_db
class TestUserModel:
    def test_create_user_with_email_and_password(self):
        user = User.objects.create_user(
            email="jane@example.com", password="s3cret-pw", full_name="Jane Doe"
        )
        assert user.email == "jane@example.com"
        assert user.full_name == "Jane Doe"
        assert user.check_password("s3cret-pw")
        assert user.role == "seeker"

    def test_password_is_hashed_not_stored_raw(self):
        user = User.objects.create_user(
            email="jane@example.com", password="s3cret-pw", full_name="Jane Doe"
        )
        assert user.password != "s3cret-pw"
        assert user.password.startswith("pbkdf2_")

    def test_email_is_the_username_field(self):
        assert User.USERNAME_FIELD == "email"
        assert "username" not in [f.name for f in User._meta.get_fields()]

    def test_email_uniqueness_is_enforced(self):
        User.objects.create_user(
            email="jane@example.com", password="pw12345678", full_name="Jane"
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    email="jane@example.com", password="other12345", full_name="Jane 2"
                )

    def test_email_is_normalised_case_insensitively(self):
        User.objects.create_user(
            email="Jane@Example.com", password="pw12345678", full_name="Jane"
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    email="jane@example.com", password="pw12345678", full_name="Jane 2"
                )

    def test_role_choices_limited_to_seeker_and_employer(self):
        user = User(email="a@example.com", full_name="A", role="admin")
        with pytest.raises(ValidationError):
            user.full_clean()

    def test_role_defaults_to_seeker(self):
        user = User.objects.create_user(
            email="jane@example.com", password="pw12345678", full_name="Jane"
        )
        assert user.role == "seeker"

    def test_full_name_and_employer_name_are_independent_fields(self):
        """A person's own name must never be conflated with a company name."""
        user = User.objects.create_user(
            email="dana@example.com",
            password="pw12345678",
            full_name="Dana Okoro",
            role="employer",
        )
        employer = Employer.objects.create(
            user=user, name="Northwind Labs", contact_email=user.email
        )
        assert user.full_name == "Dana Okoro"
        assert employer.name == "Northwind Labs"
        assert user.full_name != employer.name


@pytest.mark.django_db
class TestEmployerModel:
    def _make_user(self, email="dana@example.com"):
        return User.objects.create_user(
            email=email, password="pw12345678", full_name="Dana Okoro", role="employer"
        )

    def test_create_employer_linked_to_user(self):
        user = self._make_user()
        employer = Employer.objects.create(
            user=user, name="Northwind Labs", contact_email="hiring@northwind.test"
        )
        assert employer.user == user
        assert employer.name == "Northwind Labs"
        assert employer.contact_email == "hiring@northwind.test"

    def test_user_can_have_at_most_one_employer(self):
        user = self._make_user()
        Employer.objects.create(user=user, name="Northwind Labs", contact_email=user.email)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Employer.objects.create(
                    user=user, name="Second Co", contact_email=user.email
                )

    def test_deleting_user_cascades_to_employer(self):
        user = self._make_user()
        employer = Employer.objects.create(
            user=user, name="Northwind Labs", contact_email=user.email
        )
        employer_id = employer.id
        user.delete()
        assert not Employer.objects.filter(id=employer_id).exists()

    def test_reverse_accessor_is_employer(self):
        user = self._make_user()
        employer = Employer.objects.create(
            user=user, name="Northwind Labs", contact_email=user.email
        )
        assert user.employer == employer

    def test_contact_phone_is_optional(self):
        user = self._make_user()
        employer = Employer.objects.create(
            user=user, name="Northwind Labs", contact_email=user.email
        )
        assert employer.contact_phone == ""
