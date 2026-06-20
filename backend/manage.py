#!/usr/bin/env python
import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

    # Run the services check for runserver and migrate commands
    if len(sys.argv) > 1 and sys.argv[1] in ["runserver", "migrate"]:
        try:
            import django
            django.setup()
            from apps.common.services_check import check_services
            check_services()
        except Exception as e:
            print(f"Service check skipped or failed on initialization: {e}")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()

