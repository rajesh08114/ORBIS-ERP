from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

DATABASES = {
    "default": env.db(
        "DATABASE_URL_TEST",
        default=env("DATABASE_URL", default="postgresql://mini_erp:mini_erp@127.0.0.1:5432/mini_erp"),
    )
}
