from rest_framework import serializers

from jobs.models import Job


class JobSerializer(serializers.ModelSerializer):
    """Public read/write shape. camelCase via explicit `source=` (docs/BACKEND.md §4)."""

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
