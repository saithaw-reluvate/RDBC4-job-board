"""
Group 8 — applications model (docs/BACKEND.md §2, §8 group 8).
"""
import pytest
from django.db import IntegrityError, transaction

from applications.models import Application


@pytest.mark.django_db
class TestApplicationModel:
    def test_create_application_linked_to_job(self, job):
        application = Application.objects.create(
            job=job, applicant_name="Priya R", applicant_email="priya@example.com",
            cover_letter="c" * 60,
        )
        assert application.job == job
        assert application in job.applications.all()

    def test_deleting_job_cascades_to_applications(self, job, application):
        application_id = application.id
        job.delete()
        assert not Application.objects.filter(id=application_id).exists()

    def test_ordering_is_newest_first(self, job):
        older = Application.objects.create(
            job=job, applicant_name="A", applicant_email="a@example.com",
            cover_letter="c" * 60,
        )
        newer = Application.objects.create(
            job=job, applicant_name="B", applicant_email="b@example.com",
            cover_letter="c" * 60,
        )
        applications = list(Application.objects.all())
        assert applications.index(newer) < applications.index(older)

    def test_one_application_per_email_per_job(self, job):
        Application.objects.create(
            job=job, applicant_name="A", applicant_email="dup@example.com",
            cover_letter="c" * 60,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Application.objects.create(
                    job=job, applicant_name="A Again", applicant_email="dup@example.com",
                    cover_letter="c" * 60,
                )

    def test_same_email_can_apply_to_different_jobs(self, job, employer):
        from jobs.models import Job

        other_job = Job.objects.create(
            employer=employer, title="Other Role", description="d" * 45,
            requirements=["x"], location="Remote", category="Engineering",
            employment_type="Full-time", salary_min=1, salary_max=2,
        )
        Application.objects.create(
            job=job, applicant_name="A", applicant_email="a@example.com",
            cover_letter="c" * 60,
        )
        # Should not raise.
        Application.objects.create(
            job=other_job, applicant_name="A", applicant_email="a@example.com",
            cover_letter="c" * 60,
        )
        assert Application.objects.filter(applicant_email="a@example.com").count() == 2

    def test_id_is_a_uuid(self, application):
        import uuid

        assert isinstance(application.id, uuid.UUID)

    def test_no_status_field_exists(self):
        """
        Verified against the code: nothing in the frontend mutates application
        status, so it is dropped rather than persisted permanently as "New"
        (docs/BACKEND.md §2, §12.5).
        """
        field_names = {f.name for f in Application._meta.get_fields()}
        assert "status" not in field_names

    def test_applicant_is_optional_for_anonymous_applications(self, job):
        """The relationship must stay optional so anonymous applications keep working."""
        application = Application.objects.create(
            job=job, applicant_name="A", applicant_email="a@example.com",
            cover_letter="c" * 60,
        )
        assert application.applicant is None

    def test_applicant_links_to_the_authenticated_user(self, job, seeker):
        application = Application.objects.create(
            job=job, applicant=seeker, applicant_name=seeker.full_name,
            applicant_email=seeker.email, cover_letter="c" * 60,
        )
        assert application.applicant == seeker
        assert application in seeker.applications.all()

    def test_deleting_the_user_sets_applicant_null_not_the_application(self, job, seeker):
        application = Application.objects.create(
            job=job, applicant=seeker, applicant_name=seeker.full_name,
            applicant_email=seeker.email, cover_letter="c" * 60,
        )
        application_id = application.id
        seeker.delete()
        application.refresh_from_db()
        assert Application.objects.filter(id=application_id).exists()
        assert application.applicant is None
