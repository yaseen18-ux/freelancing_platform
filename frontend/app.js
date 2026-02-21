// API Base URL - Update this to match your Django backend
const API_BASE_URL = 'http://localhost:8000/api';

// ==================== Authentication ====================
class AuthService {
    static async register(userData) {
        try {
            // Try API first
            try {
                const response = await fetch(`${API_BASE_URL}/register/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('user', JSON.stringify(data));
                    localStorage.setItem('token', Math.random().toString(36).substr(2));
                    return data;
                }
            } catch (apiError) {
                // API failed, use demo/localStorage
                console.log('API unavailable, using demo mode');
            }

            // Demo mode - Store in localStorage
            const demoUser = {
                id: Math.random().toString(36).substr(2, 9),
                ...userData,
                first_name: userData.username,
                last_name: '',
                created_at: new Date().toISOString()
            };
            
            // Store user and all registered accounts
            localStorage.setItem('user', JSON.stringify(demoUser));
            localStorage.setItem('token', Math.random().toString(36).substr(2));
            
            // Store in accounts list
            let accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
            accounts.push(demoUser);
            localStorage.setItem('accounts', JSON.stringify(accounts));
            
            return demoUser;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    static async login(credentials) {
        try {
            // Try API first
            try {
                const response = await fetch(`${API_BASE_URL}/login/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials)
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('user', JSON.stringify(data));
                    localStorage.setItem('token', data.access || Math.random().toString(36).substr(2));
                    return data;
                }
            } catch (apiError) {
                // API failed, use demo/localStorage
                console.log('API unavailable, using demo mode');
            }

            // Demo mode - Check localStorage accounts
            const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
            const user = accounts.find(acc => 
                (acc.username === credentials.username || acc.email === credentials.username) &&
                acc.password === credentials.password
            );

            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', Math.random().toString(36).substr(2));
                return user;
            }

            throw new Error('Invalid username or password');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    static isAuthenticated() {
        return localStorage.getItem('token') !== null;
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}

// ==================== Navbar Management ====================
class NavbarManager {
    static init() {
        const user = AuthService.getUser();
        const navbarRight = document.querySelector('.navbar-right');
        
        if (!navbarRight) return;

        if (AuthService.isAuthenticated() && user) {
            navbarRight.innerHTML = `
                <div class="user-menu">
                    <span class="username">${user.username}</span>
                    <div class="dropdown-menu">
                        <a href="profile.html" class="dropdown-item">
                            <i class="fa-solid fa-user"></i> Profile
                        </a>
                        ${user.is_freelancer ? `
                            <a href="freelancer-dashboard.html" class="dropdown-item">
                                <i class="fa-solid fa-briefcase"></i> Dashboard
                            </a>
                        ` : ''}
                        ${user.is_client ? `
                            <a href="recruiter-dashboard.html" class="dropdown-item">
                                <i class="fa-solid fa-building"></i> Dashboard
                            </a>
                        ` : ''}
                        <a href="#" class="dropdown-item" onclick="AuthService.logout(); return false;">
                            <i class="fa-solid fa-sign-out-alt"></i> Logout
                        </a>
                    </div>
                </div>
            `;
        } else {
            navbarRight.innerHTML = `
                <a href="login.html" class="nav-link">Login</a>
                <a href="sign-up.html" class="nav-btn">Sign Up</a>
            `;
        }
    }
}

// ==================== Form Handlers ====================
class FormHandler {
    static initSignUpForm() {
        const form = document.querySelector('.signup-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            const confirmPassword = form.querySelector('#confirm-password').value;
            const role = form.querySelector('input[name="role"]:checked').value;

            // Validation
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters long!');
                return;
            }

            try {
                const userData = {
                    username: email.split('@')[0],
                    email: email,
                    password: password,
                    is_freelancer: role === 'freelancer',
                    is_client: role === 'recruiter'
                };

                const result = await AuthService.register(userData);
                alert('Account created successfully! Now let\'s set up your profile...');
                // Redirect to profile page for profile creation/editing
                window.location.href = 'profile.html';
            } catch (error) {
                alert('Sign up failed: ' + error.message);
            }
        });
    }

    static initLoginForm() {
        const form = document.querySelector('.login-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = form.querySelector('#username').value;
            const password = form.querySelector('#password').value;

            try {
                const result = await AuthService.login({ username, password });
                alert('Login successful! Redirecting to dashboard...');
                
                // Redirect based on user type
                const user = AuthService.getUser();
                if (user.is_freelancer) {
                    window.location.href = 'freelancer-dashboard.html';
                } else if (user.is_client) {
                    window.location.href = 'recruiter-dashboard.html';
                } else {
                    window.location.href = 'profile.html';
                }
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        });
    }
}

// ==================== Profile Management ====================
class ProfileManager {
    static async loadProfile() {
        if (!AuthService.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        const user = AuthService.getUser();
        this.displayProfile(user);
    }

    static displayProfile(user) {
        const profileCard = document.querySelector('.profile-card');
        if (!profileCard) return;

        // Get profile from localStorage or create empty one
        const profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
        const profile = profiles[user.id] || {
            title: '',
            bio: '',
            hourly_rate: 0,
            skills: ''
        };

        profileCard.innerHTML = `
            <div class="profile-header">
                <img src="https://ui-avatars.com/api/?name=${user.username}&background=5f98e2&color=fff" alt="Profile" class="profile-avatar">
                <div class="profile-info">
                    <h1>${user.first_name || user.username}</h1>
                    <p class="profile-username">@${user.username}</p>
                    <p class="profile-email">${user.email}</p>
                </div>
                <button class="edit-profile-btn" onclick="ProfileManager.showEditForm()">
                    <i class="fa-solid fa-edit"></i> Edit Profile
                </button>
            </div>
            <div class="profile-details">
                <div class="detail-item">
                    <h3>Professional Title</h3>
                    <p>${profile.title || 'Not set - Click Edit to add'}</p>
                </div>
                <div class="detail-item">
                    <h3>Bio</h3>
                    <p>${profile.bio || 'Not set - Click Edit to add'}</p>
                </div>
                <div class="detail-item">
                    <h3>Hourly Rate</h3>
                    <p>$${profile.hourly_rate || '0'}/hr</p>
                </div>
                <div class="detail-item">
                    <h3>Skills</h3>
                    <p>${profile.skills || 'Not set - Click Edit to add'}</p>
                </div>
            </div>
        `;

        // Setup edit form with current data
        this.setupEditForm(user, profile);
    }

    static setupEditForm(user, profile) {
        const editForm = document.querySelector('.edit-profile-form');
        if (!editForm) return;

        editForm.innerHTML = `
            <div class="edit-form-header">
                <h2>Edit Your Profile</h2>
            </div>
            <form id="profileForm">
                <div class="form-group">
                    <label for="title">Professional Title</label>
                    <input type="text" id="title" placeholder="e.g., Full Stack Developer" value="${profile.title || ''}">
                </div>
                <div class="form-group">
                    <label for="bio">Bio</label>
                    <textarea id="bio" placeholder="Tell us about yourself..." rows="4">${profile.bio || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="hourly_rate">Hourly Rate ($)</label>
                    <input type="number" id="hourly_rate" placeholder="50" value="${profile.hourly_rate || ''}">
                </div>
                <div class="form-group">
                    <label for="skills">Skills (comma separated)</label>
                    <input type="text" id="skills" placeholder="JavaScript, React, Node.js" value="${profile.skills || ''}">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save Profile</button>
                    <button type="button" class="btn btn-secondary" onclick="ProfileManager.showEditForm()">Cancel</button>
                </div>
            </form>
        `;

        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                ProfileManager.updateProfile(user.id);
            });
        }
    }

    static showEditForm() {
        const editForm = document.querySelector('.edit-profile-form');
        if (editForm) {
            editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
        }
    }

    static updateProfile(userId) {
        const title = document.querySelector('#title')?.value || '';
        const bio = document.querySelector('#bio')?.value || '';
        const hourly_rate = document.querySelector('#hourly_rate')?.value || 0;
        const skills = document.querySelector('#skills')?.value || '';

        const formData = { title, bio, hourly_rate, skills };

        // Save to localStorage
        let profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
        profiles[userId] = formData;
        localStorage.setItem('profiles', JSON.stringify(profiles));

        alert('Profile updated successfully!');
        this.showEditForm(); // Hide the form
        this.loadProfile(); // Reload to show updated data
    }
}

// ==================== Job Management ====================
class JobManager {
    static async loadFreelancerJobs() {
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/`, {
                headers: {
                    'Authorization': `Bearer ${AuthService.getToken()}`
                }
            });
            const jobs = await response.json();
            this.displayFreelancerJobs(jobs);
        } catch (error) {
            console.error('Error loading jobs:', error);
        }
    }

    static displayFreelancerJobs(jobs) {
        const jobsContainer = document.querySelector('.jobs-container');
        if (!jobsContainer) return;

        jobsContainer.innerHTML = jobs.map(job => `
            <div class="job-card">
                <div class="job-header">
                    <h3>${job.title}</h3>
                    <span class="job-budget">$${job.budget}</span>
                </div>
                <p class="job-description">${job.description.substring(0, 150)}...</p>
                <div class="job-meta">
                    <span class="job-category">${job.category || 'General'}</span>
                </div>
                <button class="btn btn-primary" onclick="JobManager.applyForJob(${job.id})">
                    Apply Now
                </button>
            </div>
        `).join('');
    }

    static async applyForJob(jobId) {
        const proposal = prompt('Enter your proposal:');
        const bidAmount = prompt('Enter your bid amount ($):');

        if (!proposal || !bidAmount) return;

        try {
            const response = await fetch(`${API_BASE_URL}/applications/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AuthService.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    job: jobId,
                    proposal: proposal,
                    bid_amount: parseFloat(bidAmount)
                })
            });

            if (response.ok) {
                alert('Application submitted successfully!');
            }
        } catch (error) {
            alert('Error applying for job: ' + error.message);
        }
    }

    static async loadRecruiterJobs() {
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/`, {
                headers: {
                    'Authorization': `Bearer ${AuthService.getToken()}`
                }
            });
            const jobs = await response.json();
            this.displayRecruiterJobs(jobs);
        } catch (error) {
            console.error('Error loading jobs:', error);
        }
    }

    static displayRecruiterJobs(jobs) {
        const jobsContainer = document.querySelector('.my-jobs-container');
        if (!jobsContainer) return;

        jobsContainer.innerHTML = jobs.map(job => `
            <div class="job-card-recruiter">
                <div class="job-header">
                    <h3>${job.title}</h3>
                    <span class="job-budget">$${job.budget}</span>
                </div>
                <p>${job.description.substring(0, 150)}...</p>
                <div class="job-stats">
                    <span>${job.applications || 0} Applications</span>
                </div>
                <button class="btn btn-primary" onclick="JobManager.viewApplications(${job.id})">
                    View Applications
                </button>
            </div>
        `).join('');
    }

    static viewApplications(jobId) {
        // This would open a modal or navigate to applications page
        window.location.href = `applications.html?jobId=${jobId}`;
    }
}

// ==================== Initialize on Document Load ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navbar
    NavbarManager.init();

    // Initialize forms based on page
    if (document.querySelector('.signup-form')) {
        FormHandler.initSignUpForm();
    }

    if (document.querySelector('.login-form')) {
        FormHandler.initLoginForm();
    }

    // Load content if authenticated
    if (AuthService.isAuthenticated()) {
        if (document.querySelector('.profile-card')) {
            ProfileManager.loadProfile();
        }

        if (document.querySelector('.jobs-container')) {
            JobManager.loadFreelancerJobs();
        }

        if (document.querySelector('.my-jobs-container')) {
            JobManager.loadRecruiterJobs();
        }
    }
});
