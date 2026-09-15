import pytest
from rest_framework.test import APIClient

from accounts.models import Employer, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seeker(db):
    return User.objects.create_user(
        email="seeker@example.com",
        password="pw12345678",
        full_name="Sam Seeker",
        role="seeker",
    )


@pytest.fixture
def employer_user(db):
    user = User.objects.create_user(
        email="dana@northwind.test",
        password="pw12345678",
        full_name="Dana Okoro",
        role="employer",
    )
    Employer.objects.create(
        user=user, name="Northwind Labs", contact_email=user.email
    )
    return user


@pytest.fixture
def auth_client(api_client, seeker):
    api_client.force_authenticate(user=seeker)
    return api_client


@pytest.fixture
def employer_auth_client(api_client, employer_user):
    api_client.force_authenticate(user=employer_user)
    return api_client
