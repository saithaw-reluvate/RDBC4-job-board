"""
Group 3 — jobs model (docs/BACKEND.md §2, §8 group 3).
"""
import pytest
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError

from jobs.models import Job


@pytest.mark.django_db
class TestJobModel:
    def test_required_fields_and_defaults(self, employer):
        job = Job.objects.create(
            employer=employer,
            title="Backend Engineer",
            description="Own our services." * 5,
            requirements=["Python", "Django"],
            location="Bangkok, Thailand",
            category="Engineering",
            employment_type="Full-time",
            salary_min=90000,
            salary_max=125000,
        )
        assert job.status == "Open"
        assert job.posted_at is not None
        assert job.salary_currency == "USD"
        assert job.salary_period == "year"

    def test_employer_relationship(self, employer, job):
        assert job.employer == employer
        assert job in employer.jobs.all()

    def test_deleting_employer_cascades_to_jobs(self, employer, job):
        job_id = job.id
        employer.user.delete()
        assert not Job.objects.filter(id=job_id).exists()

    def test_ordering_is_newest_first(self, employer):
        older = Job.objects.create(
            employer=employer,
            title="Older Job",
            description="d" * 45,
            requirements=["x"],
            location="Remote",
            category="Engineering",
            employment_type="Full-time",
            salary_min=1,
            salary_max=2,
        )
        newer = Job.objects.create(
            employer=employer,
            title="Newer Job",
            description="d" * 45,
            requirements=["x"],
            location="Remote",
            category="Engineering",
            employment_type="Full-time",
            salary_min=1,
            salary_max=2,
        )
        jobs = list(Job.objects.all())
        assert jobs.index(newer) < jobs.index(older)

    def test_salary_max_must_not_be_below_salary_min_db_constraint(self, employer):
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Job.objects.create(
                    employer=employer,
                    title="Bad Salary",
                    description="d" * 45,
                    requirements=["x"],
                    location="Remote",
                    category="Engineering",
                    employment_type="Full-time",
                    salary_min=100,
                    salary_max=50,
                )

    def test_salary_max_equal_to_min_is_allowed(self, employer):
        job = Job.objects.create(
            employer=employer,
            title="Fixed Salary",
            description="d" * 45,
            requirements=["x"],
            location="Remote",
            category="Engineering",
            employment_type="Full-time",
            salary_min=100,
            salary_max=100,
        )
        assert job.salary_min == job.salary_max == 100

    def test_status_choices_are_limited(self, employer):
        job = Job(
            employer=employer,
            title="Bad Status",
            description="d" * 45,
            requirements=["x"],
            location="Remote",
            category="Engineering",
            employment_type="Full-time",
            salary_min=1,
            salary_max=2,
            status="Pending",
        )
        with pytest.raises(ValidationError):
            job.full_clean()

    def test_requirements_is_stored_as_a_list(self, job):
        job.refresh_from_db()
        assert job.requirements == ["5+ years of React", "Strong TypeScript"]

    def test_id_is_a_uuid_not_sequential(self, job):
        import uuid

        assert isinstance(job.id, uuid.UUID)
