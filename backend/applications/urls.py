from django.urls import path

from applications.views import ApplicationSubmitView, EmployerApplicationListView

urlpatterns = [
    path(
        "jobs/<str:job_id>/applications/",
        ApplicationSubmitView.as_view(),
        name="application-submit",
    ),
    path(
        "employer/jobs/<str:job_id>/applications/",
        EmployerApplicationListView.as_view(),
        name="employer-application-list",
    ),
]
