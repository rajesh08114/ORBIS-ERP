from django.core.management.base import BaseCommand

from apps.api_dashboard.api import DashboardContextMixin
from apps.api_dashboard.models import DashboardProfile
from apps.api_dashboard.services import SanityTestRunner, TokenBundle


class Command(BaseCommand):
    help = "Run API sanity checks against the configured dashboard profile."

    def add_arguments(self, parser):
        parser.add_argument("--profile", default="local")
        parser.add_argument("--access-token", default="")
        parser.add_argument("--refresh-token", default="")

    def handle(self, *args, **options):
        profile, _ = DashboardProfile.objects.get_or_create(
            name=options["profile"],
            defaults={"backend_type": "django"},
        )
        helper = DashboardContextMixin()
        endpoints = helper.get_endpoints_for_profile(profile)
        runner = SanityTestRunner(
            profile=profile,
            token_bundle=TokenBundle(
                access=options["access_token"],
                refresh=options["refresh_token"],
                auth_header_prefix=profile.auth_header_prefix,
            ),
        )
        run = runner.run(endpoints, requested_by=None)
        self.stdout.write(self.style.SUCCESS(f"Run {run.id} completed with success rate {run.success_rate}%"))
