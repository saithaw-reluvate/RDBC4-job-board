from django.db.models import Count
from rest_framework.response import Response
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)

from accounts.permissions import IsEmployer, IsEmployerOrReadOnly
from jobs.models import Job
from jobs.queries import apply_search_filter_sort
from jobs.serializers import EmployerJobSerializer, JobSerializer, JobStatusUpdateSerializer


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


class EmployerJobListView(ListAPIView):
    """
    GET /api/employer/jobs/ — the signed-in employer's own jobs, with an
    applicationCount annotation removing the mock layer's separate round trip.
    """

    serializer_class = EmployerJobSerializer
    permission_classes = [IsEmployer]

    def get_queryset(self):
        return (
            Job.objects.filter(employer=self.request.user.employer)
            .annotate(application_count=Count("applications"))
        )


class EmployerJobDetailView(RetrieveUpdateDestroyAPIView):
    """
    PATCH/DELETE /api/employer/jobs/{id}/ — close/reopen or delete an own job.
    Cross-employer isolation is queryset scoping, not an object permission: a
    job outside this scope is simply not found -> 404, never 403 (docs/BACKEND.md §3).
    """

    permission_classes = [IsEmployer]
    lookup_field = "id"
    http_method_names = ["patch", "delete"]

    def get_queryset(self):
        return Job.objects.filter(employer=self.request.user.employer)

    def get_object(self):
        from django.http import Http404

        try:
            return super().get_object()
        except (ValueError, Http404) as exc:
            raise Http404 from exc

    def get_serializer_class(self):
        return JobStatusUpdateSerializer

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(JobSerializer(instance).data)
