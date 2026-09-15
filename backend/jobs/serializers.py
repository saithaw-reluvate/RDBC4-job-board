from rest_framework import serializers

from jobs.models import Job

# Stated once as module constants so the numbers are not duplicated across
# serializer, model, and tests (docs/BACKEND.md §6, DRY).
DESCRIPTION_MIN_LENGTH = 40
REQUIREMENTS_MIN_COUNT = 1


class JobSerializer(serializers.ModelSerializer):
    """Public read/write shape. camelCase via explicit `source=` (docs/BACKEND.md §4)."""

    description = serializers.CharField(min_length=DESCRIPTION_MIN_LENGTH)
    requirements = serializers.ListField(
        child=serializers.CharField(max_length=500),
        min_length=REQUIREMENTS_MIN_COUNT,
    )
    salaryMin = serializers.IntegerField(source="salary_min", min_value=0)
    salaryMax = serializers.IntegerField(source="salary_max", min_value=0)
    salaryCurrency = serializers.ChoiceField(
        source="salary_currency", choices=Job.Currency.choices, required=False
    )
    salaryPeriod = serializers.ChoiceField(
        source="salary_period", choices=Job.SalaryPeriod.choices, required=False
    )
    employmentType = serializers.ChoiceField(
        source="employment_type", choices=Job.EmploymentType.choices
    )
    postedAt = serializers.DateTimeField(source="posted_at", read_only=True)
    employerName = serializers.CharField(source="employer.name", read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "description",
            "requirements",
            "location",
            "status",
            "category",
            "salaryMin",
            "salaryMax",
            "salaryCurrency",
            "salaryPeriod",
            "employmentType",
            "postedAt",
            "employerName",
        ]
        read_only_fields = ["id", "status"]

    def validate(self, attrs):
        salary_min = attrs.get("salary_min")
        salary_max = attrs.get("salary_max")
        if salary_min is not None and salary_max is not None and salary_max < salary_min:
            raise serializers.ValidationError(
                {"salaryMax": "Maximum salary cannot be lower than the minimum."}
            )
        return attrs


class EmployerJobSerializer(JobSerializer):
    """Adds applicationCount, annotated on the queryset (docs/BACKEND.md §4)."""

    applicationCount = serializers.IntegerField(source="application_count", read_only=True)

    class Meta(JobSerializer.Meta):
        fields = JobSerializer.Meta.fields + ["applicationCount"]


class JobStatusUpdateSerializer(serializers.ModelSerializer):
    """PATCH accepts status only — V1 has no Edit control (docs/FRONTEND.md §15.5)."""

    class Meta:
        model = Job
        fields = ["status"]
