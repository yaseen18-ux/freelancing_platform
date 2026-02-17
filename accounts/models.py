from django.contrib.auth.models import AbstractUser
from django.db import models

# Custom User
class User(AbstractUser):
    is_freelancer = models.BooleanField(default=False)
    is_client = models.BooleanField(default=False)

    def __str__(self):
        return self.username

# Job model
class Job(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    budget = models.FloatField()
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')

    def __str__(self):
        return self.title

# JobApplication model
class JobApplication(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    proposal = models.TextField()
    bid_amount = models.FloatField()

    def __str__(self):
        return f"{self.freelancer.username} -> {self.job.title}"
