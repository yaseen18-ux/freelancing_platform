from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, FreelancerProfile, Skill, TechStack,
    Job, JobApplication, Notification
)

# -------------------------
# USER REGISTRATION
# -------------------------
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'user_type']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data['user_type']
        )
        return user


# -------------------------
# LOGIN
# -------------------------
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

        if not user.check_password(password):
            raise serializers.ValidationError("Incorrect password")

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "username": user.username,
            "user_type": user.user_type,
        }


# -------------------------
# SKILL & TECH STACK
# -------------------------
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']


class TechStackSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechStack
        fields = ['id', 'name']


# -------------------------
# FREELANCER PROFILE
# -------------------------
class FreelancerProfileSerializer(serializers.ModelSerializer):

    # Accept IDs instead of nested objects
    skills = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        many=True
    )
    tech_stack = serializers.PrimaryKeyRelatedField(
        queryset=TechStack.objects.all(),
        many=True
    )

    class Meta:
        model = FreelancerProfile
        fields = [
            'id',
            'education',
            'experience',
            'skills',
            'tech_stack',
            'bio',
            'hourly_rate'
        ]


# -------------------------
# JOBS
# -------------------------
class JobSerializer(serializers.ModelSerializer):
    required_skills = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all()
    )
    tech_stack = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=TechStack.objects.all()
    )

    class Meta:
        model = Job
        fields = [
            'id', 'recruiter', 'title', 'description',
            'required_skills', 'tech_stack',
            'pay_per_hour', 'experience_level',
            'is_active', 'created_at'
        ]
        read_only_fields = ['recruiter', 'created_at']


# -------------------------
# JOB APPLICATIONS
# -------------------------
class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'freelancer',
            'status', 'cover_letter', 'applied_at'
        ]
        read_only_fields = ['freelancer', 'status', 'applied_at']


# -------------------------
# NOTIFICATIONS
# -------------------------
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message',
            'is_read', 'created_at',
            'related_application'
        ]
        read_only_fields = ['created_at']
