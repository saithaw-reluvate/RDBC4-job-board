"""
Group 0 — harness. Verifies settings load and the DB connection work, and pins
the actual DRF status code for an anonymous request to a protected endpoint
(docs/BACKEND.md §3, §8 group 0) rather than trusting the plan's prediction.
"""
import pytest
from django.db import connection
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_database_connection_is_postgresql():
    assert connection.vendor == "postgresql"
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        assert cursor.fetchone() == (1,)


@pytest.mark.django_db
def test_anonymous_protected_request_status_code():
    """
    Pins the observed status for an anonymous request to a protected endpoint.
    With SessionAuthentication as the only authenticator, DRF's
    NotAuthenticated is coerced to 403, never 401 (docs/BACKEND.md §3).
    This test exists so that if that assumption is ever wrong, it fails loudly
    here instead of being silently relied on elsewhere.
    """
    client = APIClient()
    response = client.get("/api/auth/me/")
    assert response.status_code == 403
    assert response.status_code != 401
