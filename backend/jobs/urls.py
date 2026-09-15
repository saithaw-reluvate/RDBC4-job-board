from django.urls import path

from jobs.views import (
    EmployerJobDetailView,
    EmployerJobListView,
    JobDetailView,
    JobListCreateView,
)

urlpatterns = [
    path("jobs/", JobListCreateView.as_view(), name="job-list-create"),
    path("jobs/<str:id>/", JobDetailView.as_view(), name="job-detail"),
    path("employer/jobs/", EmployerJobListView.as_view(), name="employer-job-list"),
    path(
        "employer/jobs/<str:id>/",
        EmployerJobDetailView.as_view(),
        name="employer-job-detail",
    ),
]
