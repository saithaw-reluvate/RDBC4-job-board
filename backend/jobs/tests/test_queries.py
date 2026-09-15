"""
Group 5 — jobs/queries.py: search, filter, sort, relevance (docs/BACKEND.md §5, §8).

Group 5a runs first and is a spike: it verifies, against real PostgreSQL, that
the array_to_string approach to scoring ArrayField requirements actually works,
before the rest of group 5 relies on it. If this fails, §5's documented
fallback (drop requirements from the formula) is taken instead — not a second
search mechanism.
"""
import pytest

from jobs.models import Job
from jobs.queries import apply_search_filter_sort


def make_job(employer, **overrides):
    defaults = dict(
        employer=employer,
        title="Generic Role",
        description="A generic description of a generic role that is long enough." * 2,
        requirements=["Generic requirement"],
        location="Remote",
        category="Engineering",
        employment_type="Full-time",
        salary_min=50000,
        salary_max=70000,
    )
    defaults.update(overrides)
    return Job.objects.create(**defaults)


@pytest.mark.django_db
class TestRelevanceSpike:
    """Group 5a — must pass before 5b is trusted."""

    def test_search_term_only_in_requirements_is_matched_and_scores_exactly_one(
        self, employer
    ):
        job = make_job(
            employer,
            title="Backend Engineer",
            description="Own our services end to end.",
            requirements=["Kubernetes orchestration experience"],
        )
        # "kubernetes" appears nowhere except inside `requirements`.
        qs = apply_search_filter_sort(Job.objects.all(), search="kubernetes")
        results = list(qs)
        assert len(results) == 1
        assert results[0].id == job.id
        assert results[0].relevance == 1


@pytest.mark.django_db
class TestFilters:
    def test_filter_by_category(self, employer):
        eng = make_job(employer, title="Eng Role", category="Engineering")
        design = make_job(employer, title="Design Role", category="Design")

        qs = apply_search_filter_sort(Job.objects.all(), category="Design")
        ids = {j.id for j in qs}
        assert ids == {design.id}

    def test_filter_by_location(self, employer):
        remote = make_job(employer, title="Remote Role", location="Remote")
        onsite = make_job(employer, title="Onsite Role", location="Bangkok, Thailand")

        qs = apply_search_filter_sort(Job.objects.all(), location="Remote")
        ids = {j.id for j in qs}
        assert ids == {remote.id}

    def test_filter_by_category_and_location_combined(self, employer):
        match = make_job(
            employer, title="Match", category="Engineering", location="Remote"
        )
        wrong_location = make_job(
            employer, title="Wrong Loc", category="Engineering", location="Bangkok, Thailand"
        )
        wrong_category = make_job(
            employer, title="Wrong Cat", category="Design", location="Remote"
        )

        qs = apply_search_filter_sort(
            Job.objects.all(), category="Engineering", location="Remote"
        )
        ids = {j.id for j in qs}
        assert ids == {match.id}

    def test_empty_filters_apply_no_constraint(self, employer):
        make_job(employer, title="A")
        make_job(employer, title="B")
        qs = apply_search_filter_sort(Job.objects.all())
        assert qs.count() == 2


@pytest.mark.django_db
class TestSearch:
    def test_search_matches_title(self, employer):
        job = make_job(employer, title="Senior Data Analyst")
        make_job(employer, title="Marketing Manager")
        qs = apply_search_filter_sort(Job.objects.all(), search="data analyst")
        assert {j.id for j in qs} == {job.id}

    def test_search_with_no_matches_returns_empty(self, employer):
        make_job(employer, title="Marketing Manager")
        qs = apply_search_filter_sort(Job.objects.all(), search="zzznotathing")
        assert list(qs) == []

    def test_search_is_case_insensitive(self, employer):
        job = make_job(employer, title="Senior Data Analyst")
        qs = apply_search_filter_sort(Job.objects.all(), search="DATA ANALYST")
        assert {j.id for j in qs} == {job.id}


@pytest.mark.django_db
class TestSort:
    def test_sort_newest_is_default(self, employer):
        import time

        older = make_job(employer, title="Older")
        time.sleep(0.01)
        newer = make_job(employer, title="Newer")

        qs = apply_search_filter_sort(Job.objects.all())
        results = list(qs)
        assert results.index(newer) < results.index(older)

    def test_sort_salary_orders_by_max_descending(self, employer):
        low = make_job(employer, title="Low", salary_min=40000, salary_max=50000)
        high = make_job(employer, title="High", salary_min=90000, salary_max=150000)
        mid = make_job(employer, title="Mid", salary_min=60000, salary_max=80000)

        qs = apply_search_filter_sort(Job.objects.all(), sort="salary")
        results = list(qs)
        assert results == [high, mid, low]

    def test_sort_relevance_orders_by_score_descending(self, employer):
        title_match = make_job(employer, title="Design Lead")
        category_match = make_job(
            employer, title="Something Else", category="Design"
        )
        description_match = make_job(
            employer, title="Other Role", description="We love good design here." * 3
        )

        qs = apply_search_filter_sort(
            Job.objects.all(), search="design", sort="relevance"
        )
        results = list(qs)
        assert results[0].id == title_match.id
        assert results.index(category_match) < results.index(description_match)

    def test_relevance_with_no_search_term_falls_back_to_newest(self, employer):
        import time

        older = make_job(employer, title="Older")
        time.sleep(0.01)
        newer = make_job(employer, title="Newer")

        qs = apply_search_filter_sort(Job.objects.all(), sort="relevance")
        results = list(qs)
        assert results.index(newer) < results.index(older)

    def test_unknown_sort_value_falls_back_to_newest(self, employer):
        import time

        older = make_job(employer, title="Older")
        time.sleep(0.01)
        newer = make_job(employer, title="Newer")

        qs = apply_search_filter_sort(Job.objects.all(), sort="bogus")
        results = list(qs)
        assert results.index(newer) < results.index(older)

    def test_ties_are_broken_deterministically_by_id(self, employer):
        """Two jobs with identical sort keys must still produce a total order."""
        a = make_job(employer, title="A", salary_min=100, salary_max=100)
        b = make_job(employer, title="B", salary_min=100, salary_max=100)

        qs1 = list(apply_search_filter_sort(Job.objects.all(), sort="salary"))
        qs2 = list(apply_search_filter_sort(Job.objects.all(), sort="salary"))
        assert [j.id for j in qs1] == [j.id for j in qs2]
