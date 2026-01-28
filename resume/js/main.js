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
    const { filteredSkills, recentJobs, earlierJobs, profile } = applyFilters(resumeJSON);

    // Set page title based on profile
    const label = getLabel(resumeJSON);
    document.title = `${resumeJSON.basics.name} - ${label}`;

    // Set basic information - use profile-aware getters
    document.querySelector('.resume-name').textContent = resumeJSON.basics.name;
    document.querySelector('.resume-title').textContent = label;
    document.querySelector('.professional-summary').innerHTML =
        `<strong>Summary: </strong>${getSummary(resumeJSON)}`;

    // Update contact info
    const contactHTML = `
        ${resumeJSON.basics.email}<br>
        ${resumeJSON.basics.phone}<br>
        ${resumeJSON.basics.location.address ? resumeJSON.basics.location.address + '<br>' : ''}
        ${resumeJSON.basics.location.city}, ${resumeJSON.basics.location.region} ${resumeJSON.basics.location.postalCode}
    `;
    document.querySelector('.contact-info').innerHTML = contactHTML;

    // Render skill sets (filtered) - use list format if profile specifies
    const skillsFormat = profile?.skillsFormat || 'tags';
    if (skillsFormat === 'list') {
        document.getElementById('skillSets').innerHTML = renderSkillsList(filteredSkills);
    } else {
        document.getElementById('skillSets').innerHTML = renderSkills(filteredSkills);
    }

    // Render work experience (recent jobs with full detail)
    document.getElementById('jobs').innerHTML = renderWorkExperience(recentJobs);

    // Render earlier experience section (condensed) if there are earlier jobs
    const earlierSection = document.getElementById('earlier-experience-section');
    if (earlierSection) {
        if (earlierJobs.length > 0) {
            earlierSection.innerHTML = renderEarlierExperience(earlierJobs);
            earlierSection.style.display = 'block';
        } else {
            earlierSection.innerHTML = '';
            earlierSection.style.display = 'none';
        }
    }

    // Render education
    document.getElementById('schools').innerHTML = renderEducation(resumeJSON.education);

    // Update plaintext link to preserve query params
    updatePlainTextLink();
}

/**
 * Render skills section (pill/tag format - default)
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
 * Render skills section in ATS-friendly list format
 * Single column, comma-separated keywords, ~4 keywords per category
 * @param {Array} skills - Filtered skills array
 * @returns {string} HTML string
 */
function renderSkillsList(skills) {
    if (!skills || skills.length === 0) return '';

    return skills.map(skill => {
        // Limit to ~4 keywords for ATS readability
        const limitedKeywords = skill.keywords.slice(0, 4);
        const keywordList = limitedKeywords.join(', ');

        return `
            <div class="skillset-list">
                <strong>${skill.name}:</strong> ${keywordList}
            </div>
        `;
    }).join('');
}

/**
 * Render earlier experience section (condensed one-liners, expandable on click)
 * @param {Array} jobs - Array of earlier job entries
 * @returns {string} HTML string with section header and job list
 */
function renderEarlierExperience(jobs) {
    if (!jobs || jobs.length === 0) return '';

    const jobLines = jobs.map((job, index) => {
        const startYear = job.startDate ? job.startDate.split('-')[0] : '';
        const endYear = job.endDate ? job.endDate.split('-')[0] : 'Present';
        const dateRange = startYear ? `(${startYear}-${endYear})` : '';

        // Build highlights HTML if available
        let highlightsHTML = '';
        if (job.highlights && job.highlights.length > 0) {
            const items = job.highlights.map(h => {
                const cleaned = h.charAt(0) === ' ' ? h.substring(1) : h;
                return `<li>${cleaned}</li>`;
            }).join('');
            highlightsHTML = `<ul>${items}</ul>`;
        }

        return `
            <div class="earlier-job" onclick="toggleEarlierJob(this)">
                <div class="earlier-job-header">
                    <span class="earlier-position"><span class="earlier-expand-icon">+</span> ${job.position}</span>
                    <span class="earlier-company">${job.name}</span>
                    <span class="earlier-dates">${dateRange}</span>
                </div>
                <div class="earlier-job-details">
                    ${job.summary ? `<p class="earlier-summary">${job.summary}</p>` : ''}
                    ${highlightsHTML ? `<div class="earlier-highlights">${highlightsHTML}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    return `
        <h2>Additional Experience</h2>
        <div class="earlier-jobs-list">
            ${jobLines}
        </div>
    `;
}

/**
 * Toggle expanded state of an earlier job entry
 * @param {HTMLElement} element - The clicked earlier-job element
 */
function toggleEarlierJob(element) {
    element.classList.toggle('expanded');
    const icon = element.querySelector('.earlier-expand-icon');
    if (icon) {
        icon.textContent = element.classList.contains('expanded') ? '−' : '+';
    }
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
                        <h3 class="job-position">${job.position}</h3>
                        <span class="job-company">
                            <a href="${job.website}" target="_blank" rel="noopener">${job.name}</a> | ${job.location}
                        </span>
                        <span class="job-date">${startDate} to ${endDate}</span>
                    </div>
                </div>
                <div class="job-content">
                    <p class="job-summary">${job.summary}</p>
                    <div class="job-highlights">
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
        const dateRange = startDate || endDate ? `<span class="school-dates">${startDate} - ${endDate}</span>` : '';

        return `
            <div class="institution">
                <dl>
                    <dt class="school-title">${school.institution}</dt>
                    <dd>${school.area}</dd>
                    ${dateRange ? `<dd>${dateRange}</dd>` : ''}
                </dl>
            </div>
        `;
    }).join('');
}
