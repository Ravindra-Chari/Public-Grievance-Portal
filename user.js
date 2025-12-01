// ============================================
// MODULE 2: USER MODULE (Public Portal)
// ============================================

// Form Validation Functions
function validateAlphabetsOnly(input, errorId) {
    const errorEl = document.getElementById(errorId);
    const value = input.value;
    const isValid = /^[a-zA-Z\s]*$/.test(value);
    
    if (!isValid && value) {
        input.classList.add('error');
        errorEl.classList.add('show');
    } else {
        input.classList.remove('error');
        errorEl.classList.remove('show');
    }
    
    checkFormValidity();
}

function validateNumbersOnly(input, errorId) {
    const errorEl = document.getElementById(errorId);
    const value = input.value;
    const isValid = /^[0-9]*$/.test(value);
    
    if (!isValid && value) {
        input.classList.add('error');
        errorEl.classList.add('show');
    } else {
        input.classList.remove('error');
        errorEl.classList.remove('show');
    }
    
    checkFormValidity();
}

function validateGPSImage(input) {
    const errorEl = document.getElementById('photoFileError');
    const preview = document.getElementById('imagePreview');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            
            // Simulate GPS validation (in real app, would check EXIF data)
            const hasGPS = Math.random() > 0.3; // 70% success rate for demo
            
            if (hasGPS) {
                input.classList.remove('error');
                errorEl.classList.remove('show');
                input.dataset.gpsValid = 'true';
            } else {
                input.classList.add('error');
                errorEl.classList.add('show');
                input.dataset.gpsValid = 'false';
            }
            
            checkFormValidity();
        };
        
        reader.readAsDataURL(file);
    }
}

function checkFormValidity() {
    const form = document.getElementById('problemForm');
    const submitBtn = document.getElementById('submitBtn');
    const nameValid = !document.getElementById('reporterName').classList.contains('error');
    const contactValid = !document.getElementById('reporterContact').classList.contains('error');
    const photoValid = document.getElementById('photoFile').dataset.gpsValid === 'true';
    const allFilled = form.checkValidity();
    
    submitBtn.disabled = !(nameValid && contactValid && photoValid && allFilled);
}

// Grievance Submission
function submitGrievance(e) {
    e.preventDefault();
    
    const problem = {
        id: Date.now(),
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        location: document.getElementById('location').value,
        authority: document.getElementById('authority').value,
        reporterName: document.getElementById('reporterName').value,
        reporterContact: document.getElementById('reporterContact').value,
        photo: document.getElementById('imagePreview').src,
        status: 'Pending',
        dateReported: new Date().toLocaleDateString(),
        votes: 0,
        notes: []
    };
    
    const problems = getProblems();
    problems.push(problem);
    localStorage.setItem('problems', JSON.stringify(problems));
    
    // Show success message
    const successMsg = document.getElementById('successMessage');
    successMsg.classList.add('show');
    setTimeout(() => successMsg.classList.remove('show'), 3000);
    
    // Reset form
    e.target.reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('photoFile').dataset.gpsValid = 'false';
    document.getElementById('submitBtn').disabled = true;
    
    updateStats();
    renderProblems();
}

// Render Public Grievances
function renderProblems() {
    const statusFilter = document.getElementById('statusFilter').value;
    const authorityFilter = document.getElementById('authorityFilter').value;
    
    let filtered = getProblems();
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (authorityFilter !== 'all') {
        filtered = filtered.filter(p => p.authority === authorityFilter);
    }
    
    const container = document.getElementById('problemsList');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-data">No grievances match the selected filters.</div>';
        return;
    }
    
    container.innerHTML = filtered.map(problem => `
        <div class="problem-item">
            <div class="problem-header">
                <h3 class="problem-title">${problem.title}</h3>
                <span class="status-badge status-${problem.status.toLowerCase().replace(' ', '')}">${problem.status}</span>
            </div>
            <div class="problem-body">
                <div class="problem-meta">
                    <div><strong>Department:</strong> ${problem.authority}</div>
                    <div><strong>Location:</strong> ${problem.location}</div>
                    <div><strong>Reported:</strong> ${problem.dateReported}</div>
                    <div><strong>Reporter:</strong> ${problem.reporterName}</div>
                </div>
                <div class="problem-description">${problem.description}</div>
                <img src="${problem.photo}" class="problem-image" alt="Grievance photo">
                <div class="problem-actions">
                    <button class="btn btn-sm btn-primary" onclick="upvoteProblem(${problem.id})">👍 Upvote</button>
                    <span class="vote-display">👥 ${problem.votes} citizens support this</span>
                </div>
            </div>
        </div>
    `).join('');
}

function upvoteProblem(id) {
    const problems = getProblems();
    const problem = problems.find(p => p.id === id);
    if (problem) {
        problem.votes++;
        localStorage.setItem('problems', JSON.stringify(problems));
        renderProblems();
    }
}

// Event Listeners Setup
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('reporterName').addEventListener('input', function(e) {
        validateAlphabetsOnly(e.target, 'reporterNameError');
});
document.getElementById('reporterContact').addEventListener('input', function(e) {
        validateNumbersOnly(e.target, 'reporterContactError');
    });

    document.getElementById('photoFile').addEventListener('change', function(e) {
        validateGPSImage(e.target);
    });

    document.getElementById('problemForm').addEventListener('submit', submitGrievance);

    document.getElementById('statusFilter').addEventListener('change', renderProblems);
    document.getElementById('authorityFilter').addEventListener('change', renderProblems);
});