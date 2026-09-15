"""
Role authorization lives here, next to the `role` field it checks.
Ownership scoping (which job belongs to whom) lives in view querysets instead
(docs/BACKEND.md §3, §7) — there is deliberately no `IsJobOwner` class.
"""
from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsEmployer(BasePermission):
    """Authenticated, role == employer, and has an Employer row."""

    message = "Only employer accounts can perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == "employer"
            and hasattr(user, "employer")
        )


class IsEmployerOrReadOnly(BasePermission):
    """Public read access; only an employer may write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return IsEmployer().has_permission(request, view)


class IsSeeker(BasePermission):
    """Authenticated and role == seeker."""

    message = "Only job seeker accounts can perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "seeker")


class IsNotEmployer(BasePermission):
    """
    Anonymous visitors and seeker accounts pass; employer accounts do not.
    Employers browse jobs but do not apply to them -- including their own
    (fix/post-integration-issues #2).
    """

    message = "Employer accounts cannot submit job applications."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return True
        return user.role != "employer"
