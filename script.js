
// Global Variables
let problems = JSON.parse(localStorage.getItem('problems')) || [];
let admins = JSON.parse(localStorage.getItem('admins')) || [];
let currentAdmin = JSON.parse(localStorage.getItem('currentAdmin')) || null;
let currentFilter = { status: 'all', authority: 'all' };
let selectedLoginDept = '';
let selectedRegisterDept = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

function init() {
    initDemoData();
    updateUI();
    loadProblems();
    updateStats();
    setupEventListeners();
    
    if (currentAdmin) {
        showPage('admin');
        updateAdminUI();
    }
}

function setupEventListeners() {
    // Public form
    const problemForm = document.getElementById('problemForm');
    if (problemForm) {
        problemForm.addEventListener('submit', handleProblemSubmit);
    }

    // Image preview
    const photoInput = document.getElementById('photo');
    if (photoInput) {
        photoInput.addEventListener('input', handleImagePreview);
    }

    // Filters
    const statusFilter = document.getElementById('statusFilter');
    const authorityFilter = document.getElementById('authorityFilter');
    const adminStatusFilter = document.getElementById('adminStatusFilter');
    
    if (statusFilter) statusFilter.addEventListener('change', handleStatusFilter);
    if (authorityFilter) authorityFilter.addEventListener('change', handleAuthorityFilter);
    if (adminStatusFilter) adminStatusFilter.addEventListener('change', handleAdminStatusFilter);

    // Auth forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
}

// Page Navigation
function showPage(pageId) {
    // Update nav buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Update active nav button
        if (pageId === 'public') {
            document.querySelector('[onclick="showPage(\'public\')"]').classList.add('active');
            loadProblems();
            updateStats();
        } else if (pageId === 'auth') {
            document.getElementById('loginBtn').classList.add('active');
        } else if (pageId === 'admin' && currentAdmin) {
            loadAdminProblems();
            updateAdminStats();
        }
    }
}

function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminInfo = document.getElementById('adminInfo');

    if (currentAdmin) {
        loginBtn.textContent = 'Dashboard';
        loginBtn.onclick = () => showPage('admin');
        logoutBtn.style.display = 'inline-block';
        adminInfo.style.display = 'inline-block';
        adminInfo.textContent = `${currentAdmin.fullName} - ${currentAdmin.department}`;
    } else {
        loginBtn.textContent = 'Admin Access';
        loginBtn.onclick = () => showPage('auth');
        logoutBtn.style.display = 'none';
        adminInfo.style.display = 'none';
    }
}

// Auth Tab Management
function showAuthTab(tabId) {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (tabId === 'login') {
        document.querySelector('[onclick="showAuthTab(\'login\')"]').classList.add('active');
        loginTab.style.display = 'block';
        registerTab.style.display = 'none';
    } else {
        document.querySelector('[onclick="showAuthTab(\'register\')"]').classList.add('active');
        loginTab.style.display = 'none';
        registerTab.style.display = 'block';
    }
}

// Department Selection
function selectLoginDepartment(dept) {
    selectedLoginDept = dept;
    document.getElementById('loginSelectedDept').value = dept;
    
    const cards = document.querySelectorAll('#loginDepartmentCards .dept-card');
    cards.forEach(card => card.classList.remove('selected'));
    event.target.closest('.dept-card').classList.add('selected');
}

function selectRegisterDepartment(dept) {
    selectedRegisterDept = dept;
    document.getElementById('registerSelectedDept').value = dept;
    
    const cards = document.querySelectorAll('#registerDepartmentCards .dept-card');
    cards.forEach(card => card.classList.remove('selected'));
    event.target.closest('.dept-card').classList.add('selected');
}

// Problem Submission
function handleProblemSubmit(e) {
    e.preventDefault();

    const problem = {
        id: Date.now(),
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        location: document.getElementById('location').value,
        authority: document.getElementById('authority').value,
        reporterName: document.getElementById('reporterName').value || 'Anonymous',
        reporterContact: document.getElementById('reporterContact').value || 'Not provided',
        photo: document.getElementById('photo').value,
        status: 'Pending',
        votes: 0,
        dateReported: new Date().toLocaleDateString('en-IN'),
        timeReported: new Date().toLocaleTimeString('en-IN'),
        adminNotes: []
    };

    problems.push(problem);
    localStorage.setItem('problems', JSON.stringify(problems));

    showSuccessMessage();
    e.target.reset();
    document.getElementById('imagePreview').style.display = 'none';
    loadProblems();
    updateStats();
}

function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.add('show');
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 4000);
}

// Image Preview
function handleImagePreview() {
    const photoInput = document.getElementById('photo');
    const imagePreview = document.getElementById('imagePreview');
    const url = photoInput.value;
    
    if (url && isValidImageUrl(url)) {
        imagePreview.src = url;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }
}

function isValidImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || 
           url.includes('imgur') || 
           url.includes('cloudinary') ||
           url.includes('unsplash') ||
           url.startsWith('data:image/');
}

// Problem Management
function loadProblems() {
    const filteredProblems = filterProblems();
    const problemsList = document.getElementById('problemsList');
    
    if (filteredProblems.length === 0) {
        problemsList.innerHTML = '<div class="no-data">No grievances match the selected filters.</div>';
        return;
    }

    filteredProblems.sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return b.id - a.id;
    });

    problemsList.innerHTML = filteredProblems.map(problem => createProblemCard(problem, false)).join('');
}

function filterProblems() {
    return problems.filter(problem => {
        const statusMatch = currentFilter.status === 'all' || problem.status === currentFilter.status;
        const authorityMatch = currentFilter.authority === 'all' || problem.authority === currentFilter.authority;
        return statusMatch && authorityMatch;
    });
}

function createProblemCard(problem, isAdmin = false) {
    const statusClass = `status-${problem.status.toLowerCase().replace(' ', '')}`;
    const imageHtml = problem.photo && isValidImageUrl(problem.photo) 
        ? `<img src="${problem.photo}" alt="Supporting evidence" class="problem-image" onerror="this.style.display='none'">` 
        : '';

    const adminActions = isAdmin ? `
        <div class="admin-note-section">
            <div class="admin-note">
                <label class="form-label">Add Department Update:</label>
                <textarea placeholder="Enter status update or action taken..." rows="3"></textarea>
                <button class="btn btn-secondary btn-sm" onclick="addAdminNote(${problem.id}, this)" style="margin-top: 0.5rem;">Add Update</button>
            </div>
            ${problem.adminNotes && problem.adminNotes.length > 0 ? `
                <div class="admin-notes-list">
                    <h4 style="color: #495057; margin-bottom: 1rem;">Department Updates:</h4>
                    ${problem.adminNotes.map(note => `
                        <div class="admin-note-item">
                            <div class="admin-note-header">${note.admin} - ${note.date}</div>
                            <div>${escapeHtml(note.note)}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    ` : '';

    const publicActions = !isAdmin ? `
        <button class="btn btn-secondary btn-sm" onclick="voteForProblem(${problem.id})">
            Support This Issue
        </button>
        <div class="vote-display">
            ${problem.votes} citizen${problem.votes !== 1 ? 's' : ''} support${problem.votes === 1 ? 's' : ''} this
        </div>
    ` : '';

    const statusActions = isAdmin ? `
        ${problem.status !== 'In Progress' ? 
            `<button class="btn btn-warning btn-sm" onclick="updateStatus(${problem.id}, 'In Progress')">
                Mark Under Review
            </button>` : ''
        }
        ${problem.status !== 'Resolved' ? 
            `<button class="btn btn-success btn-sm" onclick="updateStatus(${problem.id}, 'Resolved')">
                Mark as Resolved
            </button>` : ''
        }
    ` : '';

    return `
        <div class="problem-item">
            <div class="problem-header">
                <h3 class="problem-title">${escapeHtml(problem.title)}</h3>
                <span class="status-badge ${statusClass}">${problem.status}</span>
            </div>
            
            <div class="problem-body">
                <div class="problem-meta">
                    <div><strong>Location:</strong> ${escapeHtml(problem.location)}</div>
                    <div><strong>Department:</strong> ${escapeHtml(problem.authority)}</div>
                    <div><strong>Reported by:</strong> ${escapeHtml(problem.reporterName)}</div>
                    <div><strong>Date:</strong> ${problem.dateReported} ${problem.timeReported}</div>
                </div>

                <div class="problem-description">${escapeHtml(problem.description)}</div>
                
                ${imageHtml}

                <div class="problem-actions">
                    ${statusActions}
                    ${publicActions}
                </div>
                
                ${adminActions}
            </div>
        </div>
    `;
}

function updateStatus(id, newStatus) {
    problems = problems.map(problem => {
        if (problem.id === id) {
            return { ...problem, status: newStatus };
        }
        return problem;
    });
    
    localStorage.setItem('problems', JSON.stringify(problems));
    
    if (currentAdmin) {
        loadAdminProblems();
        updateAdminStats();
    } else {
        loadProblems();
        updateStats();
    }
}

function voteForProblem(id) {
    problems = problems.map(problem => {
        if (problem.id === id) {
            return { ...problem, votes: problem.votes + 1 };
        }
        return problem;
    });
    
    localStorage.setItem('problems', JSON.stringify(problems));
    loadProblems();
}

function addAdminNote(problemId, buttonElement) {
    const textarea = buttonElement.previousElementSibling;
    const noteText = textarea.value.trim();
    
    if (!noteText) {
        alert('Please enter an update message');
        return;
    }

    problems = problems.map(problem => {
        if (problem.id === problemId) {
            const adminNote = {
                admin: currentAdmin.fullName,
                date: new Date().toLocaleDateString('en-IN'),
                note: noteText
            };
            return { 
                ...problem, 
                adminNotes: [...(problem.adminNotes || []), adminNote] 
            };
        }
        return problem;
    });
    
    localStorage.setItem('problems', JSON.stringify(problems));
    textarea.value = '';
    loadAdminProblems();
}

// Filter Handlers
function handleStatusFilter() {
    currentFilter.status = document.getElementById('statusFilter').value;
    loadProblems();
}

function handleAuthorityFilter() {
    currentFilter.authority = document.getElementById('authorityFilter').value;
    loadProblems();
}

function handleAdminStatusFilter() {
    loadAdminProblems();
}

// Statistics
function updateStats() {
    const total = problems.length;
    const pending = problems.filter(p => p.status === 'Pending').length;
    const progress = problems.filter(p => p.status === 'In Progress').length;
    const resolved = problems.filter(p => p.status === 'Resolved').length;

    document.getElementById('totalProblems').textContent = total;
    document.getElementById('pendingProblems').textContent = pending;
    document.getElementById('progressProblems').textContent = progress;
    document.getElementById('resolvedProblems').textContent = resolved;
}

// Admin Authentication
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const department = selectedLoginDept;

    if (!department) {
        showLoginError('Please select your department first');
        return;
    }

    // Check demo credentials
    if (username === 'admin' && password === 'admin123') {
        const demoAdmin = {
            username: 'admin',
            fullName: 'Department Administrator',
            department: department,
            email: 'admin@dept.gov.in',
            employeeId: 'ADMIN001'
        };
        loginSuccess(demoAdmin);
        return;
    }

    // Check registered admins
    const admin = admins.find(a => 
        a.username === username && 
        a.password === password && 
        a.department === department
    );

    if (admin) {
        loginSuccess(admin);
    } else {
        showLoginError('Invalid credentials or department mismatch. Please verify your login information.');
    }
}

function loginSuccess(admin) {
    currentAdmin = admin;
    localStorage.setItem('currentAdmin', JSON.stringify(admin));
    
    showPage('admin');
    updateUI();
    updateAdminUI();
    loadAdminProblems();
    updateAdminStats();
    
    document.getElementById('loginForm').reset();
    selectedLoginDept = '';
    document.getElementById('loginSelectedDept').value = '';
    
    const cards = document.querySelectorAll('#loginDepartmentCards .dept-card');
    cards.forEach(card => card.classList.remove('selected'));
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('registerFullName').value;
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const employeeId = document.getElementById('registerEmployeeId').value;
    const department = selectedRegisterDept;

    if (!department) {
        showRegisterError('Please select your department');
        return;
    }

    if (password !== confirmPassword) {
        showRegisterError('Password confirmation does not match');
        return;
    }

    if (password.length < 6) {
        showRegisterError('Password must be at least 6 characters long');
        return;
    }

    if (admins.some(a => a.username === username)) {
        showRegisterError('Username already exists. Please choose a different username.');
        return;
    }

    if (admins.some(a => a.email === email)) {
        showRegisterError('Email address already registered');
        return;
    }

    const newAdmin = {
        fullName,
        email,
        username,
        password,
        employeeId,
        department,
        registeredDate: new Date().toLocaleDateString('en-IN')
    };

    admins.push(newAdmin);
    localStorage.setItem('admins', JSON.stringify(admins));

    showRegisterSuccess();
    document.getElementById('registerForm').reset();
    selectedRegisterDept = '';
    document.getElementById('registerSelectedDept').value = '';
    
    const cards = document.querySelectorAll('#registerDepartmentCards .dept-card');
    cards.forEach(card => card.classList.remove('selected'));
}

function showRegisterError(message) {
    const errorDiv = document.getElementById('registerError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showRegisterSuccess() {
    const successDiv = document.getElementById('registerSuccess');
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
        showAuthTab('login');
    }, 3000);
}

// Admin Dashboard
function updateAdminUI() {
    if (currentAdmin) {
        document.getElementById('adminWelcome').textContent = `${currentAdmin.department} Dashboard`;
        document.getElementById('adminDeptInfo').textContent = `Welcome, ${currentAdmin.fullName} - Manage assigned grievances`;
    }
}

function loadAdminProblems() {
    if (!currentAdmin) return;
    
    const statusFilter = document.getElementById('adminStatusFilter').value;
    let deptProblems = problems.filter(p => p.authority === currentAdmin.department);
    
    if (statusFilter !== 'all') {
        deptProblems = deptProblems.filter(p => p.status === statusFilter);
    }

    const adminProblemsList = document.getElementById('adminProblemsList');
    
    if (deptProblems.length === 0) {
        adminProblemsList.innerHTML = '<div class="no-data">No grievances assigned to your department with the selected filters.</div>';
        return;
    }

    deptProblems.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        if (b.votes !== a.votes) return b.votes - a.votes;
        return b.id - a.id;
    });

    adminProblemsList.innerHTML = deptProblems.map(problem => createProblemCard(problem, true)).join('');
}

function updateAdminStats() {
    if (!currentAdmin) return;
    
    const deptProblems = problems.filter(p => p.authority === currentAdmin.department);
    const total = deptProblems.length;
    const pending = deptProblems.filter(p => p.status === 'Pending').length;
    const progress = deptProblems.filter(p => p.status === 'In Progress').length;
    const resolved = deptProblems.filter(p => p.status === 'Resolved').length;

    document.getElementById('adminTotal').textContent = total;
    document.getElementById('adminPending').textContent = pending;
    document.getElementById('adminProgress').textContent = progress;
    document.getElementById('adminResolved').textContent = resolved;
}

function logout() {
    currentAdmin = null;
    localStorage.removeItem('currentAdmin');
    showPage('public');
    updateUI();
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initDemoData() {
    if (problems.length === 0) {
        const demoProblems = [
            {
                id: Date.now() - 1000,
                title: "Street lighting failure on MG Road",
                description: "Multiple streetlights have been non-functional for the past two weeks on MG Road near the commercial district. This has created safety concerns for pedestrians and vehicular traffic during night hours.",
                location: "MG Road, Commercial District",
                authority: "Municipal Corporation",
                reporterName: "Rajesh Kumar",
                reporterContact: "+91 9876543210",
                photo: "",
                status: "Pending",
                votes: 12,
                dateReported: new Date(Date.now() - 86400000).toLocaleDateString('en-IN'),
                timeReported: "10:30 AM",
                adminNotes: []
            },
            {
                id: Date.now() - 2000,
                title: "Water supply disruption in Residential Area",
                description: "Residents of Layout Phase-2 have been experiencing irregular water supply for the past week. The issue appears to be related to pipeline maintenance work that has extended beyond the scheduled timeframe.",
                location: "Layout Phase-2, Sector 15",
                authority: "Water Department",
                reporterName: "Priya Singh",
                reporterContact: "priya.singh@email.com",
                photo: "",
                status: "In Progress",
                votes: 28,
                dateReported: new Date(Date.now() - 172800000).toLocaleDateString('en-IN'),
                timeReported: "2:15 PM",
                adminNotes: [
                    {
                        admin: "Water Department Engineer",
                        date: new Date().toLocaleDateString('en-IN'),
                        note: "Pipeline repair work is 75% complete. Water supply will be restored within 48 hours. Alternative water tanker service arranged for affected areas."
                    }
                ]
            },
            {
                id: Date.now() - 3000,
                title: "Traffic signal malfunction at Main Junction",
                description: "The traffic signal system at the busy intersection near the railway station has been malfunctioning, causing significant traffic congestion during peak hours. The signal timing appears to be incorrect.",
                location: "Railway Station Main Junction",
                authority: "Transport Department",
                reporterName: "Citizens Committee",
                reporterContact: "committee@residents.org",
                photo: "",
                status: "Resolved",
                votes: 15,
                dateReported: new Date(Date.now() - 259200000).toLocaleDateString('en-IN'),
                timeReported: "9:45 AM",
                adminNotes: [
                    {
                        admin: "Transport Department Technical Team",
                        date: new Date().toLocaleDateString('en-IN'),
                        note: "Signal timing has been recalibrated and tested. System is now functioning normally with optimized traffic flow patterns."
                    }
                ]
            },
            {
                id: Date.now() - 4000,
                title: "Garbage collection irregular in Ward 12",
                description: "Garbage collection has been irregular in Ward 12 for the past month. Accumulated waste is causing health and sanitation concerns for residents, especially during monsoon season.",
                location: "Ward 12, Green Valley Colony",
                authority: "Health Department",
                reporterName: "Ward Residents Association",
                reporterContact: "+91 9876543220",
                photo: "",
                status: "Pending",
                votes: 35,
                dateReported: new Date(Date.now() - 345600000).toLocaleDateString('en-IN'),
                timeReported: "11:20 AM",
                adminNotes: []
            }
        ];
        
        problems = demoProblems;
        localStorage.setItem('problems', JSON.stringify(problems));
    }

    // Add demo admin if none exist
    if (admins.length === 0) {
        const demoAdmin = {
            fullName: "Municipal Officer",
            email: "officer@municipal.gov.in",
            username: "municipal_admin",
            password: "admin123",
            employeeId: "MUN001",
            department: "Municipal Corporation",
            registeredDate: new Date().toLocaleDateString('en-IN')
        };
        admins.push(demoAdmin);
        localStorage.setItem('admins', JSON.stringify(admins));
    }
}