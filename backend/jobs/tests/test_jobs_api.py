"""
Group 4 — Jobs read API (docs/BACKEND.md §4, §8 group 4).
"""
import pytest

from jobs.models import Job

JOBS_URL = "/api/jobs/"


def job_detail_url(job_id):
    return f"/api/jobs/{job_id}/"


@pytest.mark.django_db
class TestJobList:
    def test_list_is_public(self, api_client, job):
        response = api_client.get(JOBS_URL)
        assert response.status_code == 200

    def test_list_shape_is_camel_case(self, api_client, job):
        response = api_client.get(JOBS_URL)
        body = response.json()[0]
        assert set(
            [
                "id",
                "title",
                "description",
                "requirements",
                "location",
                "status",
                "category",
                "salaryMin",
                "salaryMax",
                "salaryCurrency",
                "salaryPeriod",
                "employmentType",
                "postedAt",
                "employerName",
            ]
        ).issubset(body.keys())
        assert "salary_min" not in body
        assert "employer_name" not in body

    def test_employer_name_resolves_to_the_company_not_the_person(
        self, api_client, job, employer
    ):
        response = api_client.get(JOBS_URL)
        body = response.json()[0]
        assert body["employerName"] == "Northwind Labs"
        assert body["employerName"] == employer.name
        assert body["employerName"] != employer.user.full_name

    def test_empty_list_when_no_jobs(self, api_client):
        response = api_client.get(JOBS_URL)
        assert response.status_code == 200
        assert response.json() == []

    def test_id_is_a_string(self, api_client, job):
        body = api_client.get(JOBS_URL).json()[0]
        assert isinstance(body["id"], str)


@pytest.mark.django_db
class TestJobListQueryParams:
    """Confirms jobs/queries.py is actually wired into GET /api/jobs/."""

    def test_search_query_param_filters_results(self, api_client, employer):
        Job.objects.create(
            employer=employer, title="Data Analyst", description="d" * 45,
            requirements=["SQL"], location="Remote", category="Data",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        Job.objects.create(
            employer=employer, title="Marketing Manager", description="d" * 45,
            requirements=["SEO"], location="Remote", category="Marketing",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        response = api_client.get(JOBS_URL, {"search": "data"})
        titles = [j["title"] for j in response.json()]
        assert titles == ["Data Analyst"]

    def test_category_query_param_filters_results(self, api_client, employer):
        Job.objects.create(
            employer=employer, title="Eng Role", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        Job.objects.create(
            employer=employer, title="Design Role", description="d" * 45,
            requirements=["x"], location="Remote", category="Design",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        response = api_client.get(JOBS_URL, {"category": "Design"})
        titles = [j["title"] for j in response.json()]
        assert titles == ["Design Role"]

    def test_sort_salary_query_param_orders_descending(self, api_client, employer):
        Job.objects.create(
            employer=employer, title="Low", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=40000, salary_max=50000,
        )
        Job.objects.create(
            employer=employer, title="High", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=90000, salary_max=150000,
        )
        response = api_client.get(JOBS_URL, {"sort": "salary"})
        titles = [j["title"] for j in response.json()]
        assert titles == ["High", "Low"]

    def test_sort_relevance_query_param_orders_by_score(self, api_client, employer):
        Job.objects.create(
            employer=employer, title="Design Lead", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        Job.objects.create(
            employer=employer, title="Other Role", description="d" * 45,
            requirements=["x"], location="Remote", category="Design",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        response = api_client.get(JOBS_URL, {"search": "design", "sort": "relevance"})
        titles = [j["title"] for j in response.json()]
        assert titles[0] == "Design Lead"


@pytest.mark.django_db
class TestJobDetail:
    def test_detail_is_public(self, api_client, job):
        response = api_client.get(job_detail_url(job.id))
        assert response.status_code == 200
        assert response.json()["title"] == job.title

    def test_unknown_id_returns_404(self, api_client):
        import uuid

        response = api_client.get(job_detail_url(uuid.uuid4()))
        assert response.status_code == 404

    def test_malformed_id_returns_404(self, api_client):
        response = api_client.get("/api/jobs/not-a-uuid/")
        assert response.status_code == 404


@pytest.mark.django_db
class TestJobCreate:
    VALID_PAYLOAD = {
        "title": "Backend Engineer",
        "description": "Own our services end to end with a focus on reliability.",
        "requirements": ["Python", "Django", "PostgreSQL"],
        "location": "Remote",
        "category": "Engineering",
        "employmentType": "Full-time",
        "salaryMin": 90000,
        "salaryMax": 125000,
    }

    def test_employer_can_create_a_job(self, employer_auth_client, employer):
        response = employer_auth_client.post(JOBS_URL, self.VALID_PAYLOAD, format="json")
        assert response.status_code == 201
        body = response.json()
        assert body["title"] == "Backend Engineer"
        assert body["status"] == "Open"
        assert body["employerName"] == employer.name

        job = Job.objects.get(id=body["id"])
        assert job.employer == employer

    def test_seeker_cannot_create_a_job(self, auth_client):
        response = auth_client.post(JOBS_URL, self.VALID_PAYLOAD, format="json")
        assert response.status_code == 403
        assert Job.objects.count() == 0

    def test_anonymous_cannot_create_a_job(self, api_client):
        response = api_client.post(JOBS_URL, self.VALID_PAYLOAD, format="json")
        assert response.status_code == 403
        assert Job.objects.count() == 0

    def test_missing_title_returns_400(self, employer_auth_client):
        payload = {**self.VALID_PAYLOAD, "title": ""}
        response = employer_auth_client.post(JOBS_URL, payload, format="json")
        assert response.status_code == 400
        assert "title" in response.json()

    def test_description_under_40_chars_returns_400(self, employer_auth_client):
        payload = {**self.VALID_PAYLOAD, "description": "too short"}
        response = employer_auth_client.post(JOBS_URL, payload, format="json")
        assert response.status_code == 400
        assert "description" in response.json()

    def test_empty_requirements_returns_400(self, employer_auth_client):
        payload = {**self.VALID_PAYLOAD, "requirements": []}
        response = employer_auth_client.post(JOBS_URL, payload, format="json")
        assert response.status_code == 400
        assert "requirements" in response.json()

    def test_salary_max_below_min_returns_400(self, employer_auth_client):
        payload = {**self.VALID_PAYLOAD, "salaryMin": 100000, "salaryMax": 50000}
        response = employer_auth_client.post(JOBS_URL, payload, format="json")
        assert response.status_code == 400

    def test_invalid_category_returns_400(self, employer_auth_client):
        payload = {**self.VALID_PAYLOAD, "category": "Not A Real Category"}
        response = employer_auth_client.post(JOBS_URL, payload, format="json")
        assert response.status_code == 400
        assert "category" in response.json()

    def test_client_supplied_employer_is_ignored(
        self, employer_auth_client, employer, other_employer
    ):
        payload = {**self.VALID_PAYLOAD, "employer": str(other_employer.id)}
        response = employer_auth_client.post(JOBS_URL, payload, format="json")
        assert response.status_code == 201
        job = Job.objects.get(id=response.json()["id"])
        assert job.employer == employer
        assert job.employer != other_employer

    def test_status_defaults_to_open_and_is_not_client_settable(
        self, employer_auth_client
    ):
        payload = {**self.VALID_PAYLOAD, "status": "Closed"}
        response = employer_auth_client.post(JOBS_URL, payload, format="json")
        assert response.status_code == 201
        assert response.json()["status"] == "Open"
