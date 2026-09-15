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
