from django.conf import settings
from django.db import models


class DashboardProfile(models.Model):
    BACKEND_DJANGO = "django"
    BACKEND_FASTAPI = "fastapi"
    BACKEND_AUTO = "auto"

    BACKEND_CHOICES = (
        (BACKEND_AUTO, "Auto-detect"),
        (BACKEND_DJANGO, "Django / DRF"),
        (BACKEND_FASTAPI, "FastAPI"),
    )

    name = models.CharField(max_length=150, unique=True)
    backend_type = models.CharField(max_length=20, choices=BACKEND_CHOICES, default=BACKEND_AUTO)
    base_url = models.URLField(blank=True, default="")
    schema_url = models.URLField(blank=True, default="")
    active = models.BooleanField(default=True)
    auth_header_prefix = models.CharField(max_length=20, default="Bearer")
    extra_headers = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="api_dashboard_profiles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class EndpointSnapshot(models.Model):
    profile = models.ForeignKey(
        DashboardProfile,
        on_delete=models.CASCADE,
        related_name="endpoints",
    )
    path = models.CharField(max_length=512)
    method = models.CharField(max_length=16)
    module = models.CharField(max_length=200, blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    summary = models.CharField(max_length=255, blank=True, default="")
    operation_id = models.CharField(max_length=255, blank=True, default="")
    auth_required = models.BooleanField(default=False)
    request_schema = models.JSONField(default=dict, blank=True)
    response_schema = models.JSONField(default=dict, blank=True)
    last_discovered_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("profile", "path", "method")]
        indexes = [
            models.Index(fields=["profile", "module"]),
            models.Index(fields=["profile", "auth_required"]),
            models.Index(fields=["profile", "active"]),
        ]

    def __str__(self):
        return f"{self.method} {self.path}"


class TestRun(models.Model):
    STATUS_QUEUED = "queued"
    STATUS_RUNNING = "running"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = (
        (STATUS_QUEUED, "Queued"),
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    )

    profile = models.ForeignKey(DashboardProfile, on_delete=models.CASCADE, related_name="runs")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="api_dashboard_runs",
    )
    scope = models.CharField(max_length=50, default="all")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_QUEUED)
    total_endpoints = models.PositiveIntegerField(default=0)
    total_tests = models.PositiveIntegerField(default=0)
    successful_tests = models.PositiveIntegerField(default=0)
    failed_tests = models.PositiveIntegerField(default=0)
    skipped_tests = models.PositiveIntegerField(default=0)
    average_response_ms = models.FloatField(default=0)
    success_rate = models.FloatField(default=0)
    progress = models.PositiveSmallIntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    notes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Run #{self.pk} - {self.status}"


class TestResult(models.Model):
    TEST_CONNECTIVITY = "connectivity"
    TEST_AUTH = "auth"
    TEST_AUTHORIZED = "authorized"
    TEST_VALIDATION = "validation"
    TEST_PERFORMANCE = "performance"

    TEST_CHOICES = (
        (TEST_CONNECTIVITY, "Connectivity"),
        (TEST_AUTH, "Authentication"),
        (TEST_AUTHORIZED, "Authorized"),
        (TEST_VALIDATION, "Validation"),
        (TEST_PERFORMANCE, "Performance"),
    )

    STATUS_PASS = "pass"
    STATUS_FAIL = "fail"
    STATUS_SKIP = "skip"
    STATUS_WARN = "warn"

    STATUS_CHOICES = (
        (STATUS_PASS, "Pass"),
        (STATUS_FAIL, "Fail"),
        (STATUS_SKIP, "Skip"),
        (STATUS_WARN, "Warn"),
    )

    run = models.ForeignKey(TestRun, on_delete=models.CASCADE, related_name="results")
    endpoint = models.ForeignKey(
        EndpointSnapshot,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="results",
    )
    path = models.CharField(max_length=512)
    method = models.CharField(max_length=16)
    test_type = models.CharField(max_length=20, choices=TEST_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    http_status = models.PositiveSmallIntegerField(null=True, blank=True)
    response_time_ms = models.FloatField(default=0)
    request_headers = models.JSONField(default=dict, blank=True)
    request_body = models.JSONField(default=dict, blank=True)
    response_headers = models.JSONField(default=dict, blank=True)
    response_body = models.TextField(blank=True, default="")
    error_message = models.TextField(blank=True, default="")
    stack_trace = models.TextField(blank=True, default="")
    validation_errors = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["run", "status"]),
            models.Index(fields=["run", "test_type"]),
            models.Index(fields=["path", "method"]),
        ]

    def __str__(self):
        return f"{self.method} {self.path} [{self.test_type}]"
