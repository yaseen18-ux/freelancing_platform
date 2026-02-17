from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from accounts.models import User, Job, JobApplication
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

# --- Home page ---
def home(request):
    return render(request, 'core/base.html')

# --- Register ---
def register_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        user_type = request.POST.get("user_type")
        if User.objects.filter(username=username).exists():
            return render(request, 'core/register.html', {"error": "Username already exists"})
        user = User.objects.create_user(username=username, email=email, password=password, user_type=user_type)
        return redirect("login")
    return render(request, 'core/register.html')

# --- Login ---
def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            if user.user_type == "freelancer":
                return redirect("freelancer-dashboard")
            elif user.user_type == "recruiter":
                return redirect("recruiter-dashboard")
        else:
            return render(request, 'core/login.html', {"error": "Invalid credentials"})
    return render(request, 'core/login.html')

# --- Logout ---
def logout_view(request):
    logout(request)
    return redirect("login")

# --- Freelancer Dashboard ---
@login_required
def freelancer_dashboard(request):
    jobs = Job.objects.filter(is_active=True)
    if request.method == "POST":
        job_id = request.POST.get("job_id")
        cover_letter = request.POST.get("cover_letter")
        job = Job.objects.get(id=job_id)
        JobApplication.objects.create(job=job, freelancer=request.user, cover_letter=cover_letter)
        return redirect("freelancer-dashboard")
    return render(request, 'core/freelancer_dashboard.html', {"jobs": jobs})

# --- Recruiter Dashboard ---
@login_required
def recruiter_dashboard(request):
    jobs = Job.objects.filter(recruiter=request.user)
    return render(request, 'core/recruiter_dashboard.html', {"jobs": jobs})
from django.shortcuts import render

def home(request):
    return render(request, 'core/base.html')  # matches core/templates/core/base.html

