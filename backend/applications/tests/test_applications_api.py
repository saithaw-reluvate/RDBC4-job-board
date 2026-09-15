"""
Groups 9-10 — Applications API (docs/BACKEND.md §4, §6, §8).
"""
import pytest

from applications.models import Application


def submit_url(job_id):
    return f"/api/jobs/{job_id}/applications/"


def review_url(job_id):
    return f"/api/employer/jobs/{job_id}/applications/"


SEEKER_HISTORY_URL = "/api/seeker/applications/"


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
class TestSubmitApplicationRoleRestriction:
    """
    Employer accounts browse jobs but must not apply -- to any job, including
    their own (docs/BACKEND.md §6 update, fix/post-integration-issues #2).
    Anonymous visitors and seeker accounts are unaffected.
    """

    def test_seeker_can_apply(self, auth_client, job):
        response = auth_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        assert response.status_code == 201

    def test_employer_cannot_apply_to_another_employers_job(
        self, employer_auth_client, other_employer, job
    ):
        response = employer_auth_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        assert response.status_code == 403
        assert Application.objects.count() == 0

    def test_employer_cannot_apply_to_their_own_job(self, employer_auth_client, job):
        response = employer_auth_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        assert response.status_code == 403
        assert Application.objects.count() == 0

    def test_employer_denial_uses_existing_error_envelope(self, employer_auth_client, job):
        response = employer_auth_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        assert response.status_code == 403
        assert isinstance(response.json().get("detail"), str)


@pytest.mark.django_db
class TestSubmitApplicationAssociatesApplicant:
    """
    A seeker's submission is linked to their account server-side; the client
    can never choose or spoof who it is associated with (feature/seeker-
    application-history).
    """

    def test_anonymous_submission_has_no_applicant(self, api_client, job):
        response = api_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        application = Application.objects.get(id=response.json()["id"])
        assert application.applicant is None

    def test_seeker_submission_is_linked_to_their_account(self, auth_client, seeker, job):
        response = auth_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        application = Application.objects.get(id=response.json()["id"])
        assert application.applicant == seeker

    def test_client_supplied_applicant_is_ignored(self, auth_client, seeker, other_seeker, job):
        payload = {**VALID_PAYLOAD, "applicant": str(other_seeker.id), "applicantId": str(other_seeker.id)}
        response = auth_client.post(submit_url(job.id), payload, format="json")
        assert response.status_code == 201
        application = Application.objects.get(id=response.json()["id"])
        assert application.applicant == seeker
        assert application.applicant != other_seeker


@pytest.mark.django_db
class TestSeekerApplicationHistory:
    """GET /api/seeker/applications/ (feature/seeker-application-history)."""

    def test_seeker_only_endpoint(self, api_client, employer_auth_client, job):
        anon_response = api_client.get(SEEKER_HISTORY_URL)
        assert anon_response.status_code == 403

        employer_response = employer_auth_client.get(SEEKER_HISTORY_URL)
        assert employer_response.status_code == 403

    def test_empty_list_when_no_applications(self, auth_client):
        response = auth_client.get(SEEKER_HISTORY_URL)
        assert response.status_code == 200
        assert response.json() == []

    def test_returns_only_the_signed_in_seekers_applications(
        self, auth_client, other_auth_client, job
    ):
        auth_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        other_auth_client.post(
            submit_url(job.id),
            {**VALID_PAYLOAD, "applicantEmail": "other@example.com"},
            format="json",
        )

        response = auth_client.get(SEEKER_HISTORY_URL)
        body = response.json()
        assert len(body) == 1
        assert body[0]["job"]["id"] == str(job.id)

    def test_newest_first(self, auth_client, employer):
        from jobs.models import Job

        older_job = Job.objects.create(
            employer=employer, title="Older Role", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        newer_job = Job.objects.create(
            employer=employer, title="Newer Role", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        auth_client.post(
            submit_url(older_job.id),
            {**VALID_PAYLOAD, "applicantEmail": "a@example.com"},
            format="json",
        )
        auth_client.post(
            submit_url(newer_job.id),
            {**VALID_PAYLOAD, "applicantEmail": "b@example.com"},
            format="json",
        )

        response = auth_client.get(SEEKER_HISTORY_URL)
        titles = [entry["job"]["title"] for entry in response.json()]
        assert titles == ["Newer Role", "Older Role"]

    def test_response_includes_the_job_information_the_frontend_needs(
        self, auth_client, job
    ):
        auth_client.post(submit_url(job.id), VALID_PAYLOAD, format="json")
        response = auth_client.get(SEEKER_HISTORY_URL)
        entry = response.json()[0]

        assert set(["id", "submittedAt", "job"]).issubset(entry.keys())
        assert entry["job"] == {
            "id": str(job.id),
            "title": job.title,
            "employerName": job.employer.name,
            "location": job.location,
            "status": job.status,
        }

    def test_closed_jobs_still_show_their_status_in_history(
        self, auth_client, employer
    ):
        from jobs.models import Job

        open_job = Job.objects.create(
            employer=employer, title="Still Open", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        auth_client.post(submit_url(open_job.id), VALID_PAYLOAD, format="json")
        open_job.status = "Closed"
        open_job.save()

        response = auth_client.get(SEEKER_HISTORY_URL)
        assert response.json()[0]["job"]["status"] == "Closed"

    def test_anonymous_applications_are_never_retroactively_included(
        self, auth_client, seeker, job
    ):
        """
        An anonymous application (applicant=None) sharing no relation to this
        seeker must never appear in their history, even if the email happens
        to match their account -- there is no email-matching backfill.
        """
        Application.objects.create(
            job=job, applicant_name=seeker.full_name, applicant_email=seeker.email,
            cover_letter="c" * 60,
        )
        response = auth_client.get(SEEKER_HISTORY_URL)
        assert response.json() == []


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
