"""
Group 2 — Auth API (docs/BACKEND.md §4, §8 group 2).
"""
import pytest

from accounts.models import Employer, User

SIGNUP_URL = "/api/auth/signup/"
LOGIN_URL = "/api/auth/login/"
LOGOUT_URL = "/api/auth/logout/"
ME_URL = "/api/auth/me/"


@pytest.mark.django_db
class TestSignup:
    def test_seeker_signup_creates_user_with_no_employer(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {
                "name": "Sam Seeker",
                "email": "sam@example.com",
                "password": "pw12345678",
                "role": "seeker",
            },
            format="json",
        )
        assert response.status_code == 201
        body = response.json()
        assert body["name"] == "Sam Seeker"
        assert body["email"] == "sam@example.com"
        assert body["role"] == "seeker"
        assert body["employer"] is None
        assert not Employer.objects.filter(user__email="sam@example.com").exists()

    def test_signup_logs_the_user_in(self, api_client):
        api_client.post(
            SIGNUP_URL,
            {
                "name": "Sam Seeker",
                "email": "sam@example.com",
                "password": "pw12345678",
                "role": "seeker",
            },
            format="json",
        )
        me = api_client.get(ME_URL)
        assert me.status_code == 200
        assert me.json()["email"] == "sam@example.com"

    def test_employer_signup_creates_employer_with_distinct_company_name(
        self, api_client
    ):
        response = api_client.post(
            SIGNUP_URL,
            {
                "name": "Dana Okoro",
                "email": "dana@northwind.test",
                "password": "pw12345678",
                "role": "employer",
                "companyName": "Northwind Labs",
            },
            format="json",
        )
        assert response.status_code == 201
        body = response.json()
        assert body["name"] == "Dana Okoro"
        assert body["employer"]["name"] == "Northwind Labs"
        assert body["name"] != body["employer"]["name"]

        employer = Employer.objects.get(user__email="dana@northwind.test")
        assert employer.name == "Northwind Labs"
        assert employer.user.full_name == "Dana Okoro"

    def test_employer_signup_without_company_name_is_rejected(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {
                "name": "Dana Okoro",
                "email": "dana@northwind.test",
                "password": "pw12345678",
                "role": "employer",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "companyName" in response.json()
        assert not User.objects.filter(email="dana@northwind.test").exists()

    def test_seeker_signup_with_company_name_is_rejected(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {
                "name": "Sam Seeker",
                "email": "sam@example.com",
                "password": "pw12345678",
                "role": "seeker",
                "companyName": "Should Not Exist Inc.",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "companyName" in response.json()
        assert not User.objects.filter(email="sam@example.com").exists()

    def test_duplicate_email_is_rejected(self, api_client, seeker):
        response = api_client.post(
            SIGNUP_URL,
            {
                "name": "Another Sam",
                "email": seeker.email,
                "password": "pw12345678",
                "role": "seeker",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "email" in response.json()

    def test_duplicate_email_is_rejected_case_insensitively(self, api_client, seeker):
        response = api_client.post(
            SIGNUP_URL,
            {
                "name": "Another Sam",
                "email": seeker.email.upper(),
                "password": "pw12345678",
                "role": "seeker",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "email" in response.json()

    def test_short_password_is_rejected(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {
                "name": "Sam Seeker",
                "email": "sam@example.com",
                "password": "short1",
                "role": "seeker",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "password" in response.json()
        assert not User.objects.filter(email="sam@example.com").exists()

    def test_invalid_role_is_rejected(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {
                "name": "Sam",
                "email": "sam@example.com",
                "password": "pw12345678",
                "role": "admin",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "role" in response.json()


@pytest.mark.django_db
class TestLogin:
    def test_login_with_correct_credentials_succeeds(self, api_client, seeker):
        response = api_client.post(
            LOGIN_URL,
            {"email": seeker.email, "password": "pw12345678"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["email"] == seeker.email

    def test_login_starts_a_session(self, api_client, seeker):
        api_client.post(
            LOGIN_URL, {"email": seeker.email, "password": "pw12345678"}, format="json"
        )
        me = api_client.get(ME_URL)
        assert me.status_code == 200

    def test_login_with_wrong_password_returns_400(self, api_client, seeker):
        response = api_client.post(
            LOGIN_URL, {"email": seeker.email, "password": "wrong-password"}, format="json"
        )
        assert response.status_code == 400

    def test_login_with_unknown_email_returns_400(self, api_client):
        response = api_client.post(
            LOGIN_URL,
            {"email": "nobody@example.com", "password": "pw12345678"},
            format="json",
        )
        assert response.status_code == 400

    def test_login_response_matches_signup_shape(self, api_client, employer_user):
        response = api_client.post(
            LOGIN_URL,
            {"email": employer_user.email, "password": "pw12345678"},
            format="json",
        )
        assert response.status_code == 200
        body = response.json()
        assert body["employer"]["name"] == "Northwind Labs"


@pytest.mark.django_db
class TestMe:
    def test_me_is_403_when_anonymous(self, api_client):
        response = api_client.get(ME_URL)
        assert response.status_code == 403

    def test_me_is_200_when_authenticated(self, auth_client, seeker):
        response = auth_client.get(ME_URL)
        assert response.status_code == 200
        assert response.json()["email"] == seeker.email


@pytest.mark.django_db
class TestLogout:
    def test_logout_clears_the_session(self, api_client, seeker):
        api_client.post(
            LOGIN_URL, {"email": seeker.email, "password": "pw12345678"}, format="json"
        )
        assert api_client.get(ME_URL).status_code == 200

        logout_response = api_client.post(LOGOUT_URL)
        assert logout_response.status_code == 200

        assert api_client.get(ME_URL).status_code == 403

    def test_logout_requires_authentication(self, api_client):
        response = api_client.post(LOGOUT_URL)
        assert response.status_code == 403
