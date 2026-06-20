from django.views.generic import TemplateView


class DashboardShellView(TemplateView):
    template_name = "api_dashboard/dashboard.html"


class SignInView(TemplateView):
    template_name = "api_dashboard/signin.html"


class SignUpView(TemplateView):
    template_name = "api_dashboard/signup.html"
