from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import User, FreelancerProfile, Job, JobApplication, Notification, Skill, TechStack
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    FreelancerProfileSerializer,
    JobSerializer,
    JobApplicationSerializer,
    NotificationSerializer,
    SkillSerializer,
    TechStackSerializer
)
from rest_framework_simplejwt.tokens import RefreshToken

# --- Auth ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


# --- Freelancer Profile ---
class FreelancerProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FreelancerProfileSerializer

    def get_object(self):
        profile, created = FreelancerProfile.objects.get_or_create(user=self.request.user)
        return profile


# --- Jobs ---
class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'recruiter':
            return Job.objects.filter(recruiter=self.request.user)
        return Job.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)


# --- Apply Job ---
class ApplyJobView(generics.CreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)


# --- View My Applications ---
class MyApplicationsView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'freelancer':
            return JobApplication.objects.filter(freelancer=self.request.user)
        return JobApplication.objects.none()


# --- Update Application Status (Recruiter) ---
class UpdateApplicationStatusView(generics.UpdateAPIView):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['patch']

    def patch(self, request, *args, **kwargs):
        application = self.get_object()

        if request.user != application.job.recruiter:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected']:
            return Response({"detail": "Invalid status. Must be 'accepted' or 'rejected'."},
                            status=status.HTTP_400_BAD_REQUEST)

        application.status = new_status
        application.save()

        Notification.objects.create(
            user=application.freelancer,
            title=f"Application {new_status.capitalize()}",
            message=f"Your application for '{application.job.title}' has been {new_status}."
        )

        serializer = self.get_serializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- Notifications ---
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all()


# --- Skills & TechStack ---
class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]

class TechStackListView(generics.ListAPIView):
    queryset = TechStack.objects.all()
    serializer_class = TechStackSerializer
    permission_classes = [AllowAny]


