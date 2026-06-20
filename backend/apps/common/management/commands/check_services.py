from django.core.management.base import BaseCommand
from apps.common.services_check import check_services

class Command(BaseCommand):
    help = "Checks the health and initialization status of PostgreSQL and Redis services."

    def handle(self, *args, **options):
        success = check_services()
        if not success:
            self.stderr.write(self.style.WARNING("Some backend services are inactive or not fully initialized."))
