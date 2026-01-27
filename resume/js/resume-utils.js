/**
 * Resume Utilities - Shared functions for resume rendering and filtering
 * Used by: index.html (main.js), plaintextresume.html, customize.html
 *
 * Requires: resume-config.js to be loaded first
 */

/**
 * Parse URL query parameters for resume filtering
 * @returns {Object} Object with tags, years, skills, and profile
 */
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        tags: params.get('tags') ? params.get('tags').split(',').map(t => t.trim().toLowerCase()) : null,
        years: params.get('years') ? parseInt(params.get('years'), 10) : null,
        skills: params.get('skills') ? params.get('skills').split(',').map(s => s.trim().toLowerCase()) : null,
        profile: params.get('profile') ? params.get('profile').trim().toLowerCase() : null
    };
}

/**
 * Get the active profile configuration based on URL parameter
 * @returns {Object|null} Profile config object or null if no profile active
 */
function getActiveProfile() {
    const params = getQueryParams();
    if (!params.profile) return null;
    return RESUME_CONFIG.profiles?.[params.profile] || null;
}

/**
 * Get the appropriate summary text based on active profile
 * @param {Object} resumeData - The resumeJSON object
 * @returns {string} Summary text
 */
function getSummary(resumeData) {
    const profile = getActiveProfile();
    if (profile && profile.summaryKey && resumeData.summaryVariants?.[profile.summaryKey]) {
        return resumeData.summaryVariants[profile.summaryKey];
    }
    // Fall back to summaryVariants.default if it exists, otherwise basics.summary
    return resumeData.summaryVariants?.default || resumeData.basics.summary;
}

/**
 * Get the appropriate label/title based on active profile
 * @param {Object} resumeData - The resumeJSON object
 * @returns {string} Label text
 */
function getLabel(resumeData) {
    const profile = getActiveProfile();
    if (profile && profile.labelKey && resumeData.labelVariants?.[profile.labelKey]) {
        return resumeData.labelVariants[profile.labelKey];
    }
    // Fall back to labelVariants.default if it exists, otherwise basics.label
    return resumeData.labelVariants?.default || resumeData.basics.label;
}

/**
 * Partition jobs into recent (full display) and earlier (condensed) based on profile settings
 * @param {Array} work - Array of work entries (already filtered)
 * @param {number} earlierYears - Jobs older than this get condensed (default: no partition)
 * @returns {Object} { recentJobs: Array, earlierJobs: Array }
 */
function partitionJobs(work, earlierYears = null) {
    if (!earlierYears || earlierYears <= 0) {
        return { recentJobs: work, earlierJobs: [] };
    }

    const now = new Date();
    const cutoffDate = new Date(now.getFullYear() - earlierYears, now.getMonth(), now.getDate());

    const recentJobs = [];
    const earlierJobs = [];

    work.forEach(job => {
        const dateStr = job.endDate || job.startDate;
        if (!dateStr) {
            recentJobs.push(job);
            return;
        }

        const parts = dateStr.split('-');
        if (parts.length < 2) {
            recentJobs.push(job);
            return;
        }

        const jobDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parts[2] ? parseInt(parts[2]) : 1);
        if (jobDate >= cutoffDate) {
            recentJobs.push(job);
        } else {
            earlierJobs.push(job);
        }
    });

    return { recentJobs, earlierJobs };
}

/**
 * Get skills filtered and ordered by profile priorities
 * @param {Array} skills - Array of skill objects from resumeJSON
 * @param {Array|null} prioritySkills - Array of skill names to include (in order)
 * @returns {Array} Filtered and ordered skills
 */
function getProfileSkills(skills, prioritySkills = null) {
    if (!prioritySkills || prioritySkills.length === 0) {
        return skills;
    }

    // Map priority names (case-insensitive) to skills, maintaining priority order
    const priorityLower = prioritySkills.map(s => s.toLowerCase());
    const orderedSkills = [];

    priorityLower.forEach(priorityName => {
        const match = skills.find(skill => skill.name.toLowerCase() === priorityName);
        if (match) {
            orderedSkills.push(match);
        }
    });

    return orderedSkills;
}

/**
 * Filter work entries by tags (inclusion filter)
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
 * Exclude work entries by tags (exclusion filter)
 * @param {Array} work - Array of work entries from resumeJSON
 * @param {Array|null} excludeTags - Array of tag strings to exclude (lowercase)
 * @returns {Array} Filtered work entries (jobs WITHOUT any of the excluded tags)
 */
function excludeWorkByTags(work, excludeTags) {
    if (!excludeTags || excludeTags.length === 0) return work;
    return work.filter(job => {
        if (!job.tags || job.tags.length === 0) return true;
        return !job.tags.some(tag => excludeTags.includes(tag.toLowerCase()));
    });
}

/**
 * Filter work entries by years (only show jobs within N years)
 * @param {Array} work - Array of work entries from resumeJSON
 * @param {number} years - Number of years to include (default from RESUME_CONFIG)
 * @returns {Array} Filtered work entries
 */
function filterWorkByYears(work, years = RESUME_CONFIG.defaultYears) {
    if (years <= 0 || years > RESUME_CONFIG.maxYearsThreshold) return work;
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
 * Apply default filters to work and skills based on query params and profile
 * Falls back to RESUME_CONFIG defaults when no query params specified
 * @param {Object} resumeData - The resumeJSON object
 * @returns {Object} Object with filteredWork, filteredSkills, recentJobs, earlierJobs, profile, and params
 */
function applyFilters(resumeData) {
    const params = getQueryParams();
    const profile = getActiveProfile();
    let filteredWork = resumeData.work;
    let filteredSkills = resumeData.skills;

    // Determine exclude tags - profile overrides default config
    const excludeTags = profile?.excludeTags || (!params.tags ? RESUME_CONFIG.excludeTags : null);

    // Apply work filters - use URL params or fall back to config defaults
    const tagsFilter = params.tags ?? RESUME_CONFIG.defaultTags;
    filteredWork = filterWorkByTags(filteredWork, tagsFilter);

    // Apply tag exclusions
    if (excludeTags) {
        filteredWork = excludeWorkByTags(filteredWork, excludeTags);
    }

    const yearsFilter = params.years ?? RESUME_CONFIG.defaultYears;
    filteredWork = filterWorkByYears(filteredWork, yearsFilter);

    // Partition jobs into recent and earlier based on profile settings
    const earlierYears = profile?.earlierExperienceYears || null;
    const { recentJobs, earlierJobs } = partitionJobs(filteredWork, earlierYears);

    // Apply skills filter - profile priorities override URL params and defaults
    if (profile?.prioritySkills) {
        filteredSkills = getProfileSkills(filteredSkills, profile.prioritySkills);
    } else {
        const skillsFilter = params.skills ?? RESUME_CONFIG.defaultSkills;
        filteredSkills = filterSkills(filteredSkills, skillsFilter);
    }

    return {
        filteredWork,
        filteredSkills,
        recentJobs,
        earlierJobs,
        profile,
        params
    };
}
