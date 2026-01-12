// Main application script - Vanilla JS version
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the resume
    if (typeof resumeJSON !== 'undefined') {
        renderResume();
    } else {
        console.error('resumeJSON not found');
        document.querySelector('.professional-summary').textContent =
            'Error loading resume data. Please enable JavaScript and refresh.';
    }
});

// URL Query Parameter Utilities
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        tags: params.get('tags') ? params.get('tags').split(',').map(t => t.trim().toLowerCase()) : null,
        years: params.get('years') ? parseInt(params.get('years'), 10) : null,
        skills: params.get('skills') ? params.get('skills').split(',').map(s => s.trim().toLowerCase()) : null
    };
}

function filterWorkByTags(work, tags) {
    if (!tags || tags.length === 0) return work;
    return work.filter(job => {
        if (!job.tags || job.tags.length === 0) return false;
        return job.tags.some(tag => tags.includes(tag.toLowerCase()));
    });
}

function filterWorkByYears(work, years = 15) {
    if (years <= 0 || years > 50) return work;
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());

    return work.filter(job => {
        // Use endDate if available, otherwise use startDate (for current jobs)
        const dateStr = job.endDate || job.startDate;
        if (!dateStr) return true;

        const parts = dateStr.split('-');
        if (parts.length < 2) return true;

        const jobDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parts[2] ? parseInt(parts[2]) : 1);
        return jobDate >= cutoffDate;
    });
}

function filterSkills(skills, skillFilter) {
    if (!skillFilter || skillFilter.length === 0) return skills;
    return skills.filter(skill => {
        const skillName = skill.name.toLowerCase();
        return skillFilter.some(filter => skillName.includes(filter));
    });
}

function updatePlainTextLink() {
    const link = document.getElementById('plaintext-link');
    if (!link) return;

    const currentSearch = window.location.search;
    link.href = 'plaintextresume.html' + currentSearch;
}

// Utility Functions
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

// Rendering Functions
function renderResume() {
    // Get query parameters and apply filters
    const params = getQueryParams();
    let filteredWork = resumeJSON.work;
    let filteredSkills = resumeJSON.skills;

    // Apply work filters
    filteredWork = filterWorkByTags(filteredWork, params.tags);
    // Default to 15 years if no years parameter specified
    const yearsFilter = params.years != null ? params.years : 15;
    filteredWork = filterWorkByYears(filteredWork, yearsFilter);

    // Apply skills filter
    filteredSkills = filterSkills(filteredSkills, params.skills);

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

    // Render skill sets (filtered)
    document.getElementById('skillSets').innerHTML = renderSkills(filteredSkills);

    // Render work experience (filtered)
    document.getElementById('jobs').innerHTML = renderWorkExperience(filteredWork);

    // Render education
    document.getElementById('schools').innerHTML = renderEducation(resumeJSON.education);

    // Update plaintext link to preserve query params
    updatePlainTextLink();
}

function renderSkills(skills) {
    if (!skills || skills.length === 0) return '';

    return skills.map(skill => {
        const limitedKeywords = skill.keywords.slice(0, 6);
        const tags = limitedKeywords.map(kw =>
            `<span class="skill-tag">${kw}</span>`
        ).join('');

        const levelBadge = skill.level
            ? `<span class="skill-level">${skill.level}</span>`
            : '';

        return `
            <div class="skillset">
                <p>
                    <strong>${skill.name}</strong>
                    ${levelBadge}
                </p>
                <div class="skill-tags">${tags}</div>
            </div>
        `;
    }).join('');
}

function renderWorkExperience(work) {
    if (!work || work.length === 0) return '';
    
    return work.map(job => {
        const startDate = formatDate(job.startDate);
        const endDate = job.endDate ? formatDate(job.endDate) : 'Present';
        
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
            <article class="job">
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