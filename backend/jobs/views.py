from rest_framework.generics import ListCreateAPIView, RetrieveAPIView

from accounts.permissions import IsEmployerOrReadOnly
from jobs.models import Job
from jobs.queries import apply_search_filter_sort
from jobs.serializers import JobSerializer


class JobListCreateView(ListCreateAPIView):
    """
    GET /api/jobs/?search=&category=&location=&sort= — public browse, filter,
    sort (docs/BACKEND.md §5). POST /api/jobs/ — employer posts a job.
    """

    queryset = Job.objects.select_related("employer")
    serializer_class = JobSerializer
    permission_classes = [IsEmployerOrReadOnly]

    def get_queryset(self):
        params = self.request.query_params
        return apply_search_filter_sort(
            super().get_queryset(),
            search=params.get("search", ""),
            category=params.get("category", ""),
            location=params.get("location", ""),
            sort=params.get("sort", "newest"),
        )

    def perform_create(self, serializer):
        serializer.save(employer=self.request.user.employer, status=Job.Status.OPEN)


class JobDetailView(RetrieveAPIView):
    """GET /api/jobs/{id}/ — one job; 404 unknown (incl. a malformed id)."""

    queryset = Job.objects.select_related("employer")
    serializer_class = JobSerializer
    lookup_field = "id"

    def get_object(self):
        from django.http import Http404

        try:
            return super().get_object()
        except (ValueError, Http404) as exc:
            raise Http404 from exc
