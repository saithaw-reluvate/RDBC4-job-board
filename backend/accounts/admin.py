from django.contrib import admin

from accounts.models import Employer, User

admin.site.register(User)
admin.site.register(Employer)
