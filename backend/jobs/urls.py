from django.urls import path

from jobs.views import JobDetailView, JobListCreateView

urlpatterns = [
    path("jobs/", JobListCreateView.as_view(), name="job-list-create"),
    path("jobs/<str:id>/", JobDetailView.as_view(), name="job-detail"),
]
