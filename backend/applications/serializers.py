from rest_framework import serializers

from applications.models import Application
from jobs.models import Job

# Stated once as module constants so the numbers are not duplicated across
# serializer, model, and tests (docs/BACKEND.md §6, DRY).
COVER_LETTER_MIN_LENGTH = 50
COVER_LETTER_MAX_LENGTH = 2000


class ApplicationSerializer(serializers.ModelSerializer):
    """camelCase via explicit source= (docs/BACKEND.md §4). No status field (§2)."""

    applicantName = serializers.CharField(source="applicant_name", max_length=150)
    applicantEmail = serializers.EmailField(source="applicant_email")
    coverLetter = serializers.CharField(
        source="cover_letter",
        min_length=COVER_LETTER_MIN_LENGTH,
        max_length=COVER_LETTER_MAX_LENGTH,
    )
    submittedAt = serializers.DateTimeField(source="submitted_at", read_only=True)

    class Meta:
        model = Application
        fields = ["id", "applicantName", "applicantEmail", "coverLetter", "submittedAt"]

    def validate(self, attrs):
        job = self.context["job"]
        email = attrs.get("applicant_email")
        if email and Application.objects.filter(job=job, applicant_email=email).exists():
            raise serializers.ValidationError(
                {"applicantEmail": "You have already applied to this job."}
            )
        return attrs


class SeekerApplicationJobSerializer(serializers.ModelSerializer):
    """The job summary a seeker's history needs (feature/seeker-application-history)."""

    employerName = serializers.CharField(source="employer.name", read_only=True)

    class Meta:
        model = Job
        fields = ["id", "title", "employerName", "location", "status"]


class SeekerApplicationSerializer(serializers.ModelSerializer):
    """
    GET /api/seeker/applications/ — one of the signed-in seeker's own past
    applications, with the job information the frontend needs to display it
    (title, company, location, status, and the job id to link to it).
    """

    submittedAt = serializers.DateTimeField(source="submitted_at", read_only=True)
    job = SeekerApplicationJobSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ["id", "submittedAt", "job"]
