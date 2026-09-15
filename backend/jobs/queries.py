"""
Search, filter, and sort — the query logic the brief requires to live in the
backend API (docs/BACKEND.md §5). One pure function over a queryset; views call
it, they don't contain it.
"""
from django.db.models import Case, F, Func, IntegerField, TextField, Value, When
from django.db.models.functions import Lower

# Weights for the relevance formula (docs/BACKEND.md §5). Matches the V1
# frontend formula in src/lib/data/jobs.ts, so sort order does not visibly
# change at integration.
RELEVANCE_WEIGHTS = {
    "title": 10,
    "category": 5,
    "location": 5,
    "employer__name": 3,
    "description": 2,
    "requirements_text": 1,
}


def _relevance_annotation(term):
    """Sum of Case/When contains-checks, weighted per RELEVANCE_WEIGHTS."""
    needle = term.strip().lower()
    cases = [
        When(**{f"{field}__icontains": needle}, then=Value(weight))
        for field, weight in RELEVANCE_WEIGHTS.items()
    ]
    return Case(*cases, default=Value(0), output_field=IntegerField())


def apply_search_filter_sort(queryset, *, search="", category="", location="", sort="newest"):
    """
    The exact JobQuery shape the frontend already builds. category/location are
    exact match, applied only when non-empty. search matches when the weighted
    relevance score is > 0. sort is newest (default) | salary | relevance;
    relevance with no search term, or an unknown sort value, falls back to
    newest.
    """
    if category:
        queryset = queryset.filter(category=category)
    if location:
        queryset = queryset.filter(location=location)

    # requirements is an ArrayField, which has no __icontains lookup, so it is
    # scored by annotating a joined text form first (verified against real
    # PostgreSQL by test group 5a) and referencing that annotation in the
    # relevance Case/When above.
    queryset = queryset.annotate(
        requirements_text=Func(
            F("requirements"), Value(" "), function="array_to_string", output_field=TextField()
        )
    )

    term = search.strip()
    if term:
        queryset = queryset.annotate(relevance=_relevance_annotation(term))
        queryset = queryset.filter(relevance__gt=0)
    else:
        queryset = queryset.annotate(relevance=Value(0, output_field=IntegerField()))

    if sort == "salary":
        queryset = queryset.order_by("-salary_max", "-posted_at", "-id")
    elif sort == "relevance" and term:
        queryset = queryset.order_by("-relevance", "-posted_at", "-id")
    else:
        # "newest" (default), "relevance" with no search term, or unknown sort.
        queryset = queryset.order_by("-posted_at", "-id")

    return queryset
