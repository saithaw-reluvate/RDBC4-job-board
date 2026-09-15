"""
Groups 9-10 — Applications API (docs/BACKEND.md §4, §6, §8).
"""
import pytest

from applications.models import Application


def submit_url(job_id):
    return f"/api/jobs/{job_id}/applications/"


def review_url(job_id):
    return f"/api/employer/jobs/{job_id}/applications/"


VALID_PAYLOAD = {
    "applicantName": "Priya Raghunathan",
    "applicantEmail": "priya@example.com",
    "coverLetter": "c" * 60,
}


@pytest.mark.django_db
class TestSubmitApplication:
    def test_submission_is_public(self, api_client, job):
        response = api_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        assert response.status_code == 201

    def test_submission_creates_application_linked_to_job(self, api_client, job):
        response = api_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        body = response.json()
        assert body["applicantName"] == "Priya Raghunathan"
        assert body["applicantEmail"] == "priya@example.com"

        application = Application.objects.get(id=body["id"])
        assert application.job == job

    def test_missing_name_returns_400(self, api_client, job):
        payload = {**VALID_PAYLOAD, "applicantName": ""}
        response = api_client.post(submit_url(job.id), payload, format="json")
        assert response.status_code == 400
        assert "applicantName" in response.json()

    def test_invalid_email_returns_400(self, api_client, job):
        payload = {**VALID_PAYLOAD, "applicantEmail": "not-an-email"}
        response = api_client.post(submit_url(job.id), payload, format="json")
        assert response.status_code == 400
        assert "applicantEmail" in response.json()

    def test_cover_letter_too_short_returns_400(self, api_client, job):
        payload = {**VALID_PAYLOAD, "coverLetter": "too short"}
        response = api_client.post(submit_url(job.id), payload, format="json")
        assert response.status_code == 400
        assert "coverLetter" in response.json()

    def test_cover_letter_too_long_returns_400(self, api_client, job):
        payload = {**VALID_PAYLOAD, "coverLetter": "c" * 2001}
        response = api_client.post(submit_url(job.id), payload, format="json")
        assert response.status_code == 400
        assert "coverLetter" in response.json()

    def test_cover_letter_at_boundaries_is_accepted(self, api_client, job, employer):
        from jobs.models import Job

        min_job = Job.objects.create(
            employer=employer, title="Min Job", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        response = api_client.post(
            submit_url(min_job.id),
            {**VALID_PAYLOAD, "coverLetter": "c" * 50, "applicantEmail": "a@x.com"},
            format="json",
        )
        assert response.status_code == 201

        max_job = Job.objects.create(
            employer=employer, title="Max Job", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        response = api_client.post(
            submit_url(max_job.id),
            {**VALID_PAYLOAD, "coverLetter": "c" * 2000, "applicantEmail": "b@x.com"},
            format="json",
        )
        assert response.status_code == 201

    def test_unknown_job_returns_404(self, api_client):
        import uuid

        response = api_client.post(submit_url(uuid.uuid4()), VALID_PAYLOAD, format="json")
        assert response.status_code == 404

    def test_closed_job_returns_400(self, api_client, closed_job):
        response = api_client.post(submit_url(closed_job.id), VALID_PAYLOAD, format="json")
        assert response.status_code == 400
        assert Application.objects.count() == 0

    def test_duplicate_email_for_same_job_returns_400(self, api_client, job):
        api_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        response = api_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        assert response.status_code == 400
        assert Application.objects.count() == 1

    def test_same_email_can_apply_to_a_different_job(self, api_client, job, employer):
        from jobs.models import Job

        other_job = Job.objects.create(
            employer=employer, title="Other Role", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        api_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        response = api_client.post(submit_url(other_job.id), VALID_PAYLOAD, format="json")
        assert response.status_code == 201

    def test_response_has_no_status_field(self, api_client, job):
        response = api_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        assert "status" not in response.json()


@pytest.mark.django_db
class TestReviewApplications:
    def test_owner_employer_sees_applications_newest_first(
        self, employer_auth_client, job
    ):
        older = Application.objects.create(
            job=job, applicant_name="A", applicant_email="a@example.com",
            cover_letter="c" * 60,
        )
        newer = Application.objects.create(
            job=job, applicant_name="B", applicant_email="b@example.com",
            cover_letter="c" * 60,
        )
        response = employer_auth_client.get(review_url(job.id))
        assert response.status_code == 200
        ids = [a["id"] for a in response.json()]
        assert ids == [str(newer.id), str(older.id)]

    def test_other_employer_gets_404(self, other_employer_auth_client, job, application):
        response = other_employer_auth_client.get(review_url(job.id))
        assert response.status_code == 404

    def test_seeker_gets_403(self, auth_client, job):
        response = auth_client.get(review_url(job.id))
        assert response.status_code == 403

    def test_anonymous_gets_403(self, api_client, job):
        response = api_client.get(review_url(job.id))
        assert response.status_code == 403

    def test_empty_list_when_no_applications(self, employer_auth_client, job):
        response = employer_auth_client.get(review_url(job.id))
        assert response.status_code == 200
        assert response.json() == []

    def test_response_shape_is_camel_case(self, employer_auth_client, job, application):
        response = employer_auth_client.get(review_url(job.id))
        body = response.json()[0]
        assert set(["id", "applicantName", "applicantEmail", "coverLetter", "submittedAt"]).issubset(
            body.keys()
        )
        assert "applicant_name" not in body
