/**
 * Main application script - Renders the styled resume
 * Dependencies: resume-utils.js, resumeJSON.js
 */

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

/**
 * Update the plain text link to preserve query parameters
 */
function updatePlainTextLink() {
    const link = document.getElementById('plaintext-link');
    if (!link) return;

    const currentSearch = window.location.search;
    link.href = 'plaintextresume.html' + currentSearch;
}

/**
 * Main render function - applies filters and renders all sections
 */
function renderResume() {
    // Get filtered data using shared utility
    const { filteredWork, filteredSkills } = applyFilters(resumeJSON);

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

/**
 * Render skills section
 * @param {Array} skills - Filtered skills array
 * @returns {string} HTML string
 */
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

/**
 * Render work experience section
 * @param {Array} work - Filtered work array
 * @returns {string} HTML string
 */
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

/**
 * Render education section
 * @param {Array} education - Education array from resumeJSON
 * @returns {string} HTML string
 */
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
