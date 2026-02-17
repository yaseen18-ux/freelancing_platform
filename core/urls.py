from django.contrib import admin
from django.urls import path
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('freelancer/dashboard/', views.freelancer_dashboard, name='freelancer-dashboard'),
    path('recruiter/dashboard/', views.recruiter_dashboard, name='recruiter-dashboard'),
]



