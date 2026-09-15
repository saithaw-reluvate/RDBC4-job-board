import uuid

from django.db import models

from jobs.models import Job


class Application(models.Model):
    """
    [BRIEF: applicant name, email, cover letter, linked to a job].
    Anonymous — no FK to User. The frontend states "No account needed to browse
    or apply", and the brief's Application model carries only name/email/letter
    (docs/BACKEND.md §2).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    applicant_name = models.CharField(max_length=150)
    applicant_email = models.EmailField()
    cover_letter = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at", "-id"]
        indexes = [models.Index(fields=["job", "-submitted_at"], name="application_job_idx")]
        constraints = [
            models.UniqueConstraint(
                fields=["job", "applicant_email"], name="one_application_per_email_per_job"
            )
        ]

    def __str__(self):
        return f"{self.applicant_name} -> {self.job.title}"
