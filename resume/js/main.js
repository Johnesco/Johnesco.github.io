// Main application script - Vanilla JS version

// Utility Functions

function updateDownloadLinks() {
    const plainTextLink = document.getElementById('plainTextLink');
    if (plainTextLink) {
        const currentQueryString = window.location.search;
        plainTextLink.href = 'plaintextresume.html' + currentQueryString;
    }
    
    // Also update the back link if it exists
    const backLink = document.querySelector('a[href^="plaintextresume.html"]');
    if (backLink && backLink !== plainTextLink) {
        backLink.href = 'plaintextresume.html' + currentQueryString;
    }
}

function oxfordComma(array) {
    if (!array || array.length === 0) return '';
    if (array.length === 1) return array[0] + '.';
    if (array.length === 2) return array[0] + ' and ' + array[1] + '.';
    
    const last = array[array.length - 1];
    const rest = array.slice(0, -1);
    return rest.join(', ') + ', and ' + last + '.';
}

function formatDate(inputDate, format = 'long') {
    if (!inputDate) return 'Present';
    
    const parts = inputDate.split('-');
    if (parts.length !== 3) return inputDate;
    
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    
    const monthNames = {
        long: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ],
        short: [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
    };
    
    if (month < 0 || month > 11) return inputDate;
    
    if (format === 'short') {
        return `${monthNames.short[month]} ${year}`;
    }
    
    return `${monthNames.long[month]} ${year}`;
}

// Query Parameter Functions
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        timeframe: params.get('timeframe') || 'all'
    };
}

function filterWorkExperience(workArray, timeframe) {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch(timeframe) {
        case '10y':
            cutoffDate.setFullYear(now.getFullYear() - 10);
            break;
        case '5y':
            cutoffDate.setFullYear(now.getFullYear() - 5);
            break;
        case 'current':
            // Only show current/most recent job
            return workArray.map((job, index) => ({
                ...job,
                isFilteredOut: index !== 0
            }));
        case 'all':
        default:
            return workArray.map(job => ({ ...job, isFilteredOut: false }));
    }
    
    return workArray.map(job => {
        const jobStartDate = new Date(job.startDate);
        const isFilteredOut = jobStartDate < cutoffDate;
        return { ...job, isFilteredOut };
    });
}

function updateFilterStatus(timeframe, filteredCount, totalCount) {
    const statusElement = document.getElementById('filterStatus');
    if (!statusElement) return;
    
    const messages = {
        'all': `Showing full career history (${totalCount} positions)`,
        '10y': `Showing last 10 years of experience (${totalCount - filteredCount} of ${totalCount} positions)`,
        '5y': `Showing last 5 years of experience (${totalCount - filteredCount} of ${totalCount} positions)`,
        'current': `Showing current position only (1 of ${totalCount} positions)`
    };
    
    statusElement.textContent = messages[timeframe] || messages.all;
}

function createFilterToggle(filteredJobsCount) {
    if (filteredJobsCount === 0) return '';
    
    return `
        <button class="toggle-filtered-btn" id="toggleFilteredBtn">
            ${filteredJobsCount} earlier position${filteredJobsCount !== 1 ? 's' : ''} hidden (click to show)
        </button>
    `;
}

// Rendering Functions
function renderSkills(skills) {
    if (!skills || skills.length === 0) return '';
    
    return skills.map(skill => {
        const keywords = oxfordComma(skill.keywords);
        return `
            <div class="skillset">
                <p><strong>${skill.name}:</strong>${keywords}</p>
            </div>
        `;
    }).join('');
}

function renderWorkExperience(work, filteredWork) {
    if (!work || work.length === 0) return '';
    
    const totalCount = work.length;
    const filteredCount = filteredWork.filter(job => job.isFilteredOut).length;
    
    let html = createFilterToggle(filteredCount);
    
    return html + filteredWork.map(job => {
        const startDate = formatDate(job.startDate);
        const endDate = job.endDate ? formatDate(job.endDate) : 'Present';
        
        // Add filtered-out class if applicable
        const filteredClass = job.isFilteredOut ? 'filtered-out collapsed' : '';
        
        // Group highlights - split into arrays where lines starting with space trigger new group
        const highlightGroups = [];
        let currentGroup = [];
        
        if (job.highlights && job.highlights.length > 0) {
            job.highlights.forEach((highlight, index) => {
                const isNewGroupMarker = highlight.charAt(0) === ' ';
                const cleanedHighlight = isNewGroupMarker ? highlight.substring(1) : highlight;
                
                if (isNewGroupMarker && currentGroup.length > 0) {
                    highlightGroups.push([...currentGroup]);
                    currentGroup = [];
                }
                
                currentGroup.push(cleanedHighlight);
                
                // If this is the last item, add the final group
                if (index === job.highlights.length - 1 && currentGroup.length > 0) {
                    highlightGroups.push([...currentGroup]);
                }
            });
        }
        
        // Render each group as its own <ul>
        const highlightsHTML = highlightGroups.map(group => 
            `<ul>${group.map(item => `<li>${item}</li>`).join('')}</ul>`
        ).join('');
        
        return `
            <article class="job ${filteredClass}" data-job-index="${work.indexOf(job)}">
                <div class="job-header">
                    <div>
                        <h3 class="job-company">
                            <a href="${job.website}" target="_blank" rel="noopener">${job.name}</a> | ${job.location}
                        </h3>
                        <span class="job-position">${job.position}</span>
                    </div>
                    <div>
                        <span class="job-date">${startDate} to ${endDate}</span>
                    </div>
                </div>
                <div class="job-content">
                    <p class="job-summary">${job.summary}</p>
                    <div class="job-highlights">
                        <h4>Responsibilities and Accomplishments</h4>
                        ${highlightsHTML}
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function renderEducation(education) {
    if (!education || education.length === 0) return '';
    
    return education.map(school => {
        const startDate = school.startDate || '';
        const endDate = school.endDate || '';
        
        return `
            <div class="institution">
                <dl>
                    <dt class="school-title">${school.institution}: ${startDate} - ${endDate}</dt>
                    <dd>${school.area}</dd>
                </dl>
            </div>
        `;
    }).join('');
}

// Filter Toggle Setup
function setupFilterToggle() {
    const toggleBtn = document.getElementById('toggleFilteredBtn');
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', function() {
        const filteredJobs = document.querySelectorAll('.job.filtered-out');
        const isExpanded = this.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            filteredJobs.forEach(job => job.classList.add('collapsed'));
            this.classList.remove('expanded');
            this.innerHTML = `${filteredJobs.length} earlier position${filteredJobs.length !== 1 ? 's' : ''} hidden (click to show) ▼`;
        } else {
            // Expand
            filteredJobs.forEach(job => job.classList.remove('collapsed'));
            this.classList.add('expanded');
            this.innerHTML = `${filteredJobs.length} earlier position${filteredJobs.length !== 1 ? 's' : ''} visible (click to hide) ▲`;
        }
    });
}

// Main Resume Rendering
function renderResume() {
    // Set basic information
    document.querySelector('.resume-name').textContent = resumeJSON.basics.name;
    document.querySelector('.resume-title').textContent = resumeJSON.basics.label;
    document.querySelector('.professional-summary').innerHTML = 
        `<strong>Summary: </strong>${resumeJSON.basics.summary}`;
    
    // Update contact info
    const contactHTML = `
        ${resumeJSON.basics.email}<br>
        ${resumeJSON.basics.phone}<br>
        ${resumeJSON.basics.location.address ? resumeJSON.basics.location.address + '<br>' : ''}
        ${resumeJSON.basics.location.city}, ${resumeJSON.basics.location.region} ${resumeJSON.basics.location.postalCode}
    `;
    document.querySelector('.contact-info').innerHTML = contactHTML;
    
    // Get query parameters
    const queryParams = getQueryParams();
    
    // Filter work experience based on query parameter
    const filteredWork = filterWorkExperience(resumeJSON.work, queryParams.timeframe);
    const filteredCount = filteredWork.filter(job => job.isFilteredOut).length;
    
    // Update filter status display
    updateFilterStatus(queryParams.timeframe, filteredCount, resumeJSON.work.length);
    
    // Render skill sets
    document.getElementById('skillSets').innerHTML = renderSkills(resumeJSON.skills);
    
    // Render work experience
    document.getElementById('jobs').innerHTML = renderWorkExperience(resumeJSON.work, filteredWork);
    
    // Render education
    document.getElementById('schools').innerHTML = renderEducation(resumeJSON.education);
    
    // Add toggle functionality
    setupFilterToggle();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (typeof resumeJSON !== 'undefined') {
        renderResume();
    } else {
        console.error('resumeJSON not found');
        document.querySelector('.professional-summary').textContent = 
            'Error loading resume data. Please enable JavaScript and refresh.';
    }
});