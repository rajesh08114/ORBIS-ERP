.PHONY: help install venv sync run migrate makemigrations superuser check test lint docker-up docker-down docker-logs docker-reset-db

help:
	@echo "Targets:"
	@echo "  install         Install dependencies with uv"
	@echo "  venv            Create a local virtual environment with python"
	@echo "  sync            Sync dependencies with uv"
	@echo "  run             Start Django dev server"
	@echo "  migrate         Run database migrations"
	@echo "  makemigrations  Create migrations for apps"
	@echo "  superuser       Create a Django superuser"
	@echo "  check           Run Django system checks"
	@echo "  test            Run tests"
	@echo "  lint            Run Ruff"
	@echo "  docker-up       Start Postgres, Redis, and Django with Docker Compose"
	@echo "  docker-down     Stop Docker Compose services"
	@echo "  docker-logs     Stream Docker Compose logs"
	@echo "  docker-reset-db Remove Docker Postgres volume and recreate a clean database"

install:
	uv sync --extra dev

venv:
	python -m venv .venv

sync:
	uv sync

run:
	uv run python manage.py runserver 0.0.0.0:8000

migrate:
	uv run python manage.py migrate

makemigrations:
	uv run python manage.py makemigrations

superuser:
	uv run python manage.py createsuperuser

check:
	uv run python manage.py check

test:
	uv run pytest

lint:
	uv run ruff check .

docker-up:
	docker compose up --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-reset-db:
	docker compose down -v
