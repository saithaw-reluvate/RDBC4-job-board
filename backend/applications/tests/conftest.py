import pytest
from rest_framework.test import APIClient

from accounts.models import Employer, User
from applications.models import Application
from jobs.models import Job


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seeker(db):
    return User.objects.create_user(
        email="seeker@example.com", password="pw12345678", full_name="Sam Seeker",
        role="seeker",
    )


@pytest.fixture
def other_seeker(db):
    return User.objects.create_user(
        email="other.seeker@example.com", password="pw12345678", full_name="Oly Otherseeker",
        role="seeker",
    )


@pytest.fixture
def employer(db):
    user = User.objects.create_user(
        email="dana@northwind.test", password="pw12345678", full_name="Dana Okoro",
        role="employer",
    )
    return Employer.objects.create(user=user, name="Northwind Labs", contact_email=user.email)


@pytest.fixture
def other_employer(db):
    user = User.objects.create_user(
        email="lee@acme.test", password="pw12345678", full_name="Lee Acme", role="employer",
    )
    return Employer.objects.create(user=user, name="Acme Inc.", contact_email=user.email)


@pytest.fixture
def job(db, employer):
    return Job.objects.create(
        employer=employer, title="Senior Frontend Engineer",
        description="Build responsive UIs with a focus on accessibility." * 2,
        requirements=["5+ years of React", "Strong TypeScript"], location="Remote",
        category="Engineering", employment_type="Full-time",
        salary_min=120000, salary_max=160000,
    )


@pytest.fixture
def closed_job(db, employer):
    return Job.objects.create(
        employer=employer, title="Closed Role", description="d" * 45,
        requirements=["x"], location="Remote", category="Engineering",
        employment_type="Full-time", salary_min=1, salary_max=2, status="Closed",
    )


@pytest.fixture
def application(db, job):
    return Application.objects.create(
        job=job, applicant_name="Priya R", applicant_email="priya@example.com",
        cover_letter="c" * 60,
    )


@pytest.fixture
def employer_auth_client(api_client, employer):
    api_client.force_authenticate(user=employer.user)
    return api_client


@pytest.fixture
def other_employer_auth_client(api_client, other_employer):
    api_client.force_authenticate(user=other_employer.user)
    return api_client


@pytest.fixture
def auth_client(api_client, seeker):
    api_client.force_authenticate(user=seeker)
    return api_client


@pytest.fixture
def other_auth_client(other_seeker):
    # A dedicated APIClient, not the shared api_client fixture: this client
    # must stay independently authenticated as other_seeker at the same time
    # auth_client is authenticated as seeker within the same test.
    client = APIClient()
    client.force_authenticate(user=other_seeker)
    return client
