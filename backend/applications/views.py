from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView, ListCreateAPIView
from accounts.permissions import IsEmployer, IsNotEmployer
from applications.models import Application
from applications.serializers import ApplicationSerializer
from jobs.models import Job


class ApplicationSubmitView(ListCreateAPIView):
    """
    POST /api/jobs/{id}/applications/ — anonymous and seeker submission. The
    job must exist (404) and be Open (400) (docs/BACKEND.md §6). Employer
    accounts are rejected with 403 (IsNotEmployer) -- they browse jobs but do
    not apply, including to their own (fix/post-integration-issues #2).

    Only POST is exposed on this path; GET here is not part of the approved API
    (review happens on the employer-scoped path instead) so this view only
    implements create.
    """

    http_method_names = ["post"]
    permission_classes = [IsNotEmployer]
    serializer_class = ApplicationSerializer

    def _get_job(self):
        try:
            return get_object_or_404(Job, id=self.kwargs["job_id"])
        except (ValueError, Http404) as exc:
            raise Http404 from exc

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["job"] = self._get_job()
        return context

    def perform_create(self, serializer):
        job = self._get_job()
        if job.status != Job.Status.OPEN:
            raise ValidationError(
                {"detail": "This job is no longer accepting applications."}
            )
        serializer.save(job=job)


class EmployerApplicationListView(ListAPIView):
    """
    GET /api/employer/jobs/{id}/applications/ — applications for one's own job,
    newest first. Another employer's job is out of scope -> 404, never 403.
    """

    serializer_class = ApplicationSerializer
    permission_classes = [IsEmployer]

    def get_queryset(self):
        job = get_object_or_404(
            Job, id=self.kwargs["job_id"], employer=self.request.user.employer
        )
        return Application.objects.filter(job=job)
