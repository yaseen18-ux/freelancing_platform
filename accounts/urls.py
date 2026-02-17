from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    FreelancerProfileView,
    SkillListView,
    TechStackListView,
    JobViewSet,
    ApplyJobView,
    MyApplicationsView,
    UpdateApplicationStatusView,
    NotificationListView
)

router = DefaultRouter()
router.register('jobs', JobViewSet, basename='jobs')

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),

    # Freelancer Profile
    path('freelancer/profile/', FreelancerProfileView.as_view()),

    # Skills & Tech stack
    path('skills/', SkillListView.as_view()),
    path('techstack/', TechStackListView.as_view()),

    # Jobs
    path('', include(router.urls)),

    # Apply Job
    path('applications/', ApplyJobView.as_view()),

    # My Applications
    path('my-applications/', MyApplicationsView.as_view()),

    # Update Application Status (Recruiter)
    path('applications/<int:pk>/update-status/', UpdateApplicationStatusView.as_view()),

    # Notifications
    path('notifications/', NotificationListView.as_view()),
]
