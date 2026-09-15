"""
Group 7 — employer scoping (docs/BACKEND.md §3, §4, §8 group 7).

Cross-employer isolation is queryset scoping, not an object permission: another
employer's job is simply not in scope, so get_object() raises Http404 -> 404,
never 403 (docs/BACKEND.md §3).
"""
import pytest

from jobs.models import Job

EMPLOYER_JOBS_URL = "/api/employer/jobs/"


def employer_job_detail_url(job_id):
    return f"/api/employer/jobs/{job_id}/"


@pytest.mark.django_db
class TestEmployerJobList:
    def test_returns_only_own_jobs(self, employer_auth_client, employer, other_employer, job):
        other_job = Job.objects.create(
            employer=other_employer, title="Other Co Role", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        response = employer_auth_client.get(EMPLOYER_JOBS_URL)
        assert response.status_code == 200
        ids = {j["id"] for j in response.json()}
        assert ids == {str(job.id)}
        assert str(other_job.id) not in ids

    def test_includes_application_count(self, employer_auth_client, employer, job):
        from applications.models import Application

        Application.objects.create(
            job=job, applicant_name="A", applicant_email="a@example.com",
            cover_letter="c" * 60,
        )
        Application.objects.create(
            job=job, applicant_name="B", applicant_email="b@example.com",
            cover_letter="c" * 60,
        )
        response = employer_auth_client.get(EMPLOYER_JOBS_URL)
        body = response.json()[0]
        assert body["applicationCount"] == 2

    def test_zero_applications_reports_zero_not_missing(self, employer_auth_client, job):
        response = employer_auth_client.get(EMPLOYER_JOBS_URL)
        assert response.json()[0]["applicationCount"] == 0

    def test_seeker_cannot_access_employer_job_list(self, auth_client):
        response = auth_client.get(EMPLOYER_JOBS_URL)
        assert response.status_code == 403

    def test_anonymous_cannot_access_employer_job_list(self, api_client):
        response = api_client.get(EMPLOYER_JOBS_URL)
        assert response.status_code == 403


@pytest.mark.django_db
class TestEmployerJobPatch:
    def test_owner_can_close_own_job(self, employer_auth_client, job):
        response = employer_auth_client.patch(
            employer_job_detail_url(job.id), {"status": "Closed"}, format="json"
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Closed"
        job.refresh_from_db()
        assert job.status == "Closed"

    def test_owner_can_reopen_own_job(self, employer_auth_client, job):
        job.status = "Closed"
        job.save()
        response = employer_auth_client.patch(
            employer_job_detail_url(job.id), {"status": "Open"}, format="json"
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Open"

    def test_other_employers_job_returns_404_not_403(
        self, other_employer_auth_client, job
    ):
        response = other_employer_auth_client.patch(
            employer_job_detail_url(job.id), {"status": "Closed"}, format="json"
        )
        assert response.status_code == 404
        job.refresh_from_db()
        assert job.status == "Open"

    def test_patch_only_accepts_status_field(self, employer_auth_client, job):
        response = employer_auth_client.patch(
            employer_job_detail_url(job.id), {"title": "Hijacked Title"}, format="json"
        )
        job.refresh_from_db()
        assert job.title != "Hijacked Title"

    def test_seeker_cannot_patch_any_job(self, auth_client, job):
        response = auth_client.patch(
            employer_job_detail_url(job.id), {"status": "Closed"}, format="json"
        )
        assert response.status_code == 403

    def test_anonymous_cannot_patch(self, api_client, job):
        response = api_client.patch(
            employer_job_detail_url(job.id), {"status": "Closed"}, format="json"
        )
        assert response.status_code == 403


@pytest.mark.django_db
class TestEmployerJobDelete:
    def test_owner_can_delete_own_job(self, employer_auth_client, job):
        response = employer_auth_client.delete(employer_job_detail_url(job.id))
        assert response.status_code == 204
        assert not Job.objects.filter(id=job.id).exists()

    def test_delete_cascades_to_applications(self, employer_auth_client, job):
        from applications.models import Application

        application = Application.objects.create(
            job=job, applicant_name="A", applicant_email="a@example.com",
            cover_letter="c" * 60,
        )
        employer_auth_client.delete(employer_job_detail_url(job.id))
        assert not Application.objects.filter(id=application.id).exists()

    def test_other_employers_job_delete_returns_404(
        self, other_employer_auth_client, job
    ):
        response = other_employer_auth_client.delete(employer_job_detail_url(job.id))
        assert response.status_code == 404
        assert Job.objects.filter(id=job.id).exists()

    def test_seeker_cannot_delete(self, auth_client, job):
        response = auth_client.delete(employer_job_detail_url(job.id))
        assert response.status_code == 403
        assert Job.objects.filter(id=job.id).exists()
