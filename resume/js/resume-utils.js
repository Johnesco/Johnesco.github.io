/**
 * Resume Utilities - Shared functions for resume rendering and filtering
 * Used by: index.html (main.js), plaintextresume.html, customize.html
 */

// Default number of years to show in work history
const DEFAULT_YEARS_FILTER = 15;

/**
 * Parse URL query parameters for resume filtering
 * @returns {Object} Object with tags, years, and skills arrays/values
 */
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        tags: params.get('tags') ? params.get('tags').split(',').map(t => t.trim().toLowerCase()) : null,
        years: params.get('years') ? parseInt(params.get('years'), 10) : null,
        skills: params.get('skills') ? params.get('skills').split(',').map(s => s.trim().toLowerCase()) : null
    };
}

/**
 * Filter work entries by tags
 * @param {Array} work - Array of work entries from resumeJSON
 * @param {Array|null} tags - Array of tag strings to filter by (lowercase)
 * @returns {Array} Filtered work entries
 */
function filterWorkByTags(work, tags) {
    if (!tags || tags.length === 0) return work;
    return work.filter(job => {
        if (!job.tags || job.tags.length === 0) return false;
        return job.tags.some(tag => tags.includes(tag.toLowerCase()));
    });
}

/**
 * Filter work entries by years (only show jobs within N years)
 * @param {Array} work - Array of work entries from resumeJSON
 * @param {number} years - Number of years to include (default: DEFAULT_YEARS_FILTER)
 * @returns {Array} Filtered work entries
 */
function filterWorkByYears(work, years = DEFAULT_YEARS_FILTER) {
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

/**
 * Filter skills by skill name
 * @param {Array} skills - Array of skill objects from resumeJSON
 * @param {Array|null} skillFilter - Array of skill name substrings to filter by (lowercase)
 * @returns {Array} Filtered skills
 */
function filterSkills(skills, skillFilter) {
    if (!skillFilter || skillFilter.length === 0) return skills;
    return skills.filter(skill => {
        const skillName = skill.name.toLowerCase();
        return skillFilter.some(filter => skillName.includes(filter));
    });
}

/**
 * Convert array to Oxford comma separated string
 * @param {Array} array - Array of strings
 * @returns {string} Comma-separated string with Oxford comma and period
 */
function oxfordComma(array) {
    if (!array || array.length === 0) return '';
    if (array.length === 1) return array[0] + '.';
    if (array.length === 2) return array[0] + ' and ' + array[1] + '.';

    const last = array[array.length - 1];
    const rest = array.slice(0, -1);
    return rest.join(', ') + ', and ' + last + '.';
}

/**
 * Format a date string (YYYY-MM-DD) to human readable format
 * @param {string|null} inputDate - Date string in YYYY-MM-DD format
 * @param {string} format - 'long' for full month name, 'short' for abbreviated
 * @returns {string} Formatted date string or 'Present' if null
 */
function formatDate(inputDate, format = 'long') {
    if (!inputDate) return 'Present';

    const parts = inputDate.split('-');
    if (parts.length !== 3) return inputDate;

    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;

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

/**
 * Apply default filters to work and skills based on query params
 * @param {Object} resumeData - The resumeJSON object
 * @returns {Object} Object with filteredWork and filteredSkills arrays
 */
function applyFilters(resumeData) {
    const params = getQueryParams();
    let filteredWork = resumeData.work;
    let filteredSkills = resumeData.skills;

    // Apply work filters
    filteredWork = filterWorkByTags(filteredWork, params.tags);
    // Default to DEFAULT_YEARS_FILTER years if no years parameter specified
    const yearsFilter = params.years != null ? params.years : DEFAULT_YEARS_FILTER;
    filteredWork = filterWorkByYears(filteredWork, yearsFilter);

    // Apply skills filter
    filteredSkills = filterSkills(filteredSkills, params.skills);

    return { filteredWork, filteredSkills, params };
}
