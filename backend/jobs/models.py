import uuid

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import CheckConstraint, Q

from accounts.models import Employer


class Job(models.Model):
    """[BRIEF: title, description, location, requirements, status]"""

    class Category(models.TextChoices):
        ENGINEERING = "Engineering", "Engineering"
        DESIGN = "Design", "Design"
        PRODUCT = "Product", "Product"
        DATA = "Data", "Data"
        MARKETING = "Marketing", "Marketing"
        SALES = "Sales", "Sales"
        OPERATIONS = "Operations", "Operations"
        CUSTOMER_SUPPORT = "Customer Support", "Customer Support"
        FINANCE = "Finance", "Finance"

    class EmploymentType(models.TextChoices):
        FULL_TIME = "Full-time", "Full-time"
        PART_TIME = "Part-time", "Part-time"
        CONTRACT = "Contract", "Contract"
        INTERNSHIP = "Internship", "Internship"

    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        CLOSED = "Closed", "Closed"

    class Currency(models.TextChoices):
        USD = "USD", "USD"
        GBP = "GBP", "GBP"
        EUR = "EUR", "EUR"

    class SalaryPeriod(models.TextChoices):
        YEAR = "year", "year"
        MONTH = "month", "month"
        HOUR = "hour", "hour"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employer = models.ForeignKey(Employer, on_delete=models.CASCADE, related_name="jobs")

    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = ArrayField(models.CharField(max_length=500))
    location = models.CharField(max_length=120)
    category = models.CharField(max_length=40, choices=Category.choices)
    employment_type = models.CharField(max_length=20, choices=EmploymentType.choices)

    salary_min = models.PositiveIntegerField()
    salary_max = models.PositiveIntegerField()
    salary_currency = models.CharField(
        max_length=3, choices=Currency.choices, default=Currency.USD
    )
    salary_period = models.CharField(
        max_length=10, choices=SalaryPeriod.choices, default=SalaryPeriod.YEAR
    )

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    posted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-posted_at", "-id"]
        constraints = [
            CheckConstraint(
                condition=Q(salary_max__gte=models.F("salary_min")),
                name="job_salary_max_gte_min",
            )
        ]
        indexes = [
            models.Index(fields=["-posted_at"], name="job_posted_at_idx"),
            models.Index(fields=["category"], name="job_category_idx"),
            models.Index(fields=["-salary_max"], name="job_salary_max_idx"),
        ]

    def __str__(self):
        return self.title
