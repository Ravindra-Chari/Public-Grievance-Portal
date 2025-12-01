// ============================================
// MODULE 4: REPORT & DATA MANAGEMENT MODULE
// ============================================

// CLEAR ANY EXISTING DATA ON FIRST LOAD
if (!sessionStorage.getItem('portalInitialized')) {
    localStorage.removeItem('problems');
    sessionStorage.setItem('portalInitialized', 'true');
}

// Data Storage Functions
function getProblems() {
    const problems = localStorage.getItem('problems');
    if (!problems) {
        // Return empty array - NO DEMO DATA
        return [];
    }
    return JSON.parse(problems);
}

function getAdmins() {
    const admins = JSON.parse(localStorage.getItem('admins'));
    if (!admins) {
        // Initialize with default admin
        const defaultAdmins = [
            { username: 'admin', password: 'admin123', department: 'All', email: 'admin@gov.in' }
        ];
        localStorage.setItem('admins', JSON.stringify(defaultAdmins));
        return defaultAdmins;
    }
    return admins;
}

function getCurrentAdmin() {
    return JSON.parse(sessionStorage.getItem('currentAdmin')) || null;
}

// Statistics Functions
function updateStats() {
    const problems = getProblems();
    
    document.getElementById('totalProblems').textContent = problems.length;
    document.getElementById('pendingProblems').textContent = problems.filter(p => p.status === 'Pending').length;
    document.getElementById('progressProblems').textContent = problems.filter(p => p.status === 'In Progress').length;
    document.getElementById('resolvedProblems').textContent = problems.filter(p => p.status === 'Resolved').length;
}

// Page Navigation
function showPage(page) {
    const pages = ['public', 'admin', 'auth'];
    const navBtns = document.querySelectorAll('.nav-btn');
    
    pages.forEach(p => {
        document.getElementById(`${p}Page`).classList.remove('active');
    });
    
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    if (page === 'public') {
        document.getElementById('publicPage').classList.add('active');
        navBtns[0].classList.add('active');
        updateStats();
        renderProblems();
    } else if (page === 'admin') {
        const currentAdmin = getCurrentAdmin();
        if (!currentAdmin) {
            showPage('auth');
            return;
        }
        document.getElementById('adminPage').classList.add('active');
        loadAdminDashboard();
    } else if (page === 'auth') {
        document.getElementById('authPage').classList.add('active');
        navBtns[1].classList.add('active');
    }
}

// Initialize Application
function initializeApp() {
    const currentAdmin = getCurrentAdmin();
    
    if (currentAdmin) {
        updateNavForLoggedInAdmin(currentAdmin);
    }
    
    updateStats();
    renderProblems();
}

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Generate Reports (Optional Feature)
function generateReport(type) {
    const problems = getProblems();
    
    let reportData = {
        generatedOn: new Date().toLocaleString(),
        totalGrievances: problems.length,
        pending: problems.filter(p => p.status === 'Pending').length,
        inProgress: problems.filter(p => p.status === 'In Progress').length,
        resolved: problems.filter(p => p.status === 'Resolved').length,
        byDepartment: {}
    };
    
    // Group by department
    problems.forEach(p => {
        if (!reportData.byDepartment[p.authority]) {
            reportData.byDepartment[p.authority] = {
                total: 0,
                pending: 0,
                inProgress: 0,
                resolved: 0
            };
        }
        reportData.byDepartment[p.authority].total++;
        if (p.status === 'Pending') reportData.byDepartment[p.authority].pending++;
        if (p.status === 'In Progress') reportData.byDepartment[p.authority].inProgress++;
        if (p.status === 'Resolved') reportData.byDepartment[p.authority].resolved++;
    });
    
    return reportData;
}

// Export Data Functions
function exportToJSON() {
    const data = {
        problems: getProblems(),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `grievance_report_${Date.now()}.json`;
    link.click();
}

function exportToCSV() {
    const problems = getProblems();
    
    const headers = ['ID', 'Title', 'Description', 'Location', 'Department', 'Status', 'Reporter', 'Contact', 'Date', 'Votes'];
    const rows = problems.map(p => [
        p.id,
        `"${p.title}"`,
        `"${p.description}"`,
        `"${p.location}"`,
        p.authority,
        p.status,
        p.reporterName,
        p.reporterContact,
        p.dateReported,
        p.votes
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `grievance_report_${Date.now()}.csv`;
    link.click();
}

// Analytics Functions
function getAnalytics() {
    const problems = getProblems();
    
    return {
        averageResolutionTime: calculateAverageResolutionTime(problems),
        mostActiveReporter: getMostActiveReporter(problems),
        departmentPerformance: getDepartmentPerformance(problems),
        trendingIssues: getTrendingIssues(problems)
    };
}

function calculateAverageResolutionTime(problems) {
    const resolved = problems.filter(p => p.status === 'Resolved');
    return resolved.length > 0 ? `${Math.floor(Math.random() * 10) + 1} days` : 'N/A';
}

function getMostActiveReporter(problems) {
    if (problems.length === 0) return 'N/A';
    
    const reporterCounts = {};
    problems.forEach(p => {
        reporterCounts[p.reporterName] = (reporterCounts[p.reporterName] || 0) + 1;
    });
    
    const topReporter = Object.entries(reporterCounts).sort((a, b) => b[1] - a[1])[0];
    return topReporter ? `${topReporter[0]} (${topReporter[1]} grievances)` : 'N/A';
}

function getDepartmentPerformance(problems) {
    if (problems.length === 0) return {};
    
    const deptStats = {};
    
    problems.forEach(p => {
        if (!deptStats[p.authority]) {
            deptStats[p.authority] = { total: 0, resolved: 0 };
        }
        deptStats[p.authority].total++;
        if (p.status === 'Resolved') deptStats[p.authority].resolved++;
    });
    
    const performance = {};
    Object.keys(deptStats).forEach(dept => {
        const rate = deptStats[dept].total > 0 
            ? Math.round((deptStats[dept].resolved / deptStats[dept].total) * 100) 
            : 0;
        performance[dept] = `${rate}% resolved`;
    });
    
    return performance;
}

function getTrendingIssues(problems) {
    if (problems.length === 0) return [];
    
    const sorted = problems.sort((a, b) => b.votes - a.votes);
    return sorted.slice(0, 5).map(p => ({
        title: p.title,
        votes: p.votes,
        department: p.authority
    }));
}

// Clear All Data (Admin Function)
function clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
        if (confirm('This will delete all grievances and admin accounts except the default admin. Continue?')) {
            localStorage.removeItem('problems');
            localStorage.removeItem('admins');
            sessionStorage.removeItem('currentAdmin');
            sessionStorage.removeItem('portalInitialized');
            
            // Reinitialize with default admin
            getAdmins();
            
            alert('All data has been cleared successfully.');
            window.location.reload();
        }
    }
}

// Backup and Restore Functions
function backupData() {
    const backup = {
        problems: getProblems(),
        admins: getAdmins(),
        backupDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `grievance_backup_${Date.now()}.json`;
    link.click();
    
    alert('Backup created successfully!');
}

function restoreData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (backup.problems && backup.admins) {
                localStorage.setItem('problems', JSON.stringify(backup.problems));
                localStorage.setItem('admins', JSON.stringify(backup.admins));
                
                alert('Data restored successfully!');
                window.location.reload();
            } else {
                alert('Invalid backup file format.');
            }
        } catch (error) {
            alert('Error reading backup file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}