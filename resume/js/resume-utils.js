/**
 * Resume Utilities - Shared functions for resume rendering and filtering
 * Used by: index.html (main.js), plaintextresume.html, customize.html
 *
 * Requires: resume-config.js to be loaded first
 */

/**
 * Parse URL query parameters for resume filtering
 * @returns {Object} Object with years (work history), additional (extra condensed years), profile, and format
 */
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        years: params.get('years') ? parseInt(params.get('years'), 10) : null,
        additional: params.get('additional') ? parseInt(params.get('additional'), 10) : null,
        profile: params.get('profile') ? params.get('profile').trim().toLowerCase() : null,
        format: params.get('format') ? params.get('format').trim().toLowerCase() : null
    };
}

/**
 * Get the active profile configuration based on URL parameter
 * Falls back to RESUME_CONFIG.defaultProfile if no profile param specified
 * @returns {Object|null} Profile config object or null if no profile active
 */
function getActiveProfile() {
    const params = getQueryParams();
    // Use URL param if provided, otherwise fall back to default profile
    const profileName = params.profile ?? RESUME_CONFIG.defaultProfile;
    if (!profileName) return null;
    return RESUME_CONFIG.profiles?.[profileName] || null;
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
 * Partition jobs into recent (full display) and earlier (condensed) based on a cutoff
 * @param {Array} work - Array of work entries (already filtered)
 * @param {number} detailedYears - Jobs within this many years get full details; older ones are condensed
 * @returns {Object} { recentJobs: Array, earlierJobs: Array }
 */
function partitionJobs(work, detailedYears = null) {
    if (!detailedYears || detailedYears <= 0) {
        return { recentJobs: work, earlierJobs: [] };
    }

    const now = new Date();
    const cutoffDate = new Date(now.getFullYear() - detailedYears, now.getMonth(), now.getDate());

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
 * Filter skills by profile name (using tags, like jobs)
 * Skills appear if their tags array includes the profile name
 * Special case: "all" profile shows all skills regardless of tags
 * @param {Array} skills - Array of skill objects from resumeJSON
 * @param {string|null} profileName - Profile name to filter by (e.g., "qa-lead", "all")
 * @returns {Array} Filtered skills
 */
function filterSkillsByProfile(skills, profileName) {
    if (!profileName) return skills;
    if (profileName.toLowerCase() === 'all') return skills;
    const profileLower = profileName.toLowerCase();
    return skills.filter(skill => {
        if (!skill.tags || skill.tags.length === 0) return false;
        return skill.tags.some(tag => tag.toLowerCase() === profileLower);
    });
}

/**
 * Filter work entries by profile name
 * Jobs appear if their tags array includes the profile name
 * Special case: "all" profile shows all jobs regardless of tags
 * @param {Array} work - Array of work entries from resumeJSON
 * @param {string|null} profileName - Profile name to filter by (e.g., "qa-lead", "all")
 * @returns {Array} Filtered work entries
 */
function filterWorkByProfile(work, profileName) {
    if (!profileName) return work;
    // "all" profile shows everything
    if (profileName.toLowerCase() === 'all') return work;
    const profileLower = profileName.toLowerCase();
    return work.filter(job => {
        if (!job.tags || job.tags.length === 0) return false;
        return job.tags.some(tag => tag.toLowerCase() === profileLower);
    });
}

/**
 * Filter work entries by years (only show jobs within N years)
 * @param {Array} work - Array of work entries from resumeJSON
 * @param {number} years - Number of years to include (default from RESUME_CONFIG)
 * @returns {Array} Filtered work entries
 */
function filterWorkByYears(work, years = RESUME_CONFIG.defaultWorkHistoryYears) {
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
 *
 * Uses the additive history model:
 *   workHistoryYears (X) = years of full-detail Professional Experience
 *   additionalHistoryYears (Y) = MORE years beyond X as condensed Additional Experience
 *   Total visible history = X + Y
 *
 * @param {Object} resumeData - The resumeJSON object
 * @returns {Object} Object with filteredWork, filteredSkills, recentJobs, earlierJobs, profile, profileName, and params
 */
function applyFilters(resumeData) {
    const params = getQueryParams();
    const profile = getActiveProfile();
    // Get the profile name for filtering jobs by their tags
    const profileName = params.profile ?? RESUME_CONFIG.defaultProfile;
    let filteredWork = resumeData.work;
    let filteredSkills = resumeData.skills;

    // Filter jobs by profile - jobs appear if their tags include the profile name
    filteredWork = filterWorkByProfile(filteredWork, profileName);

    // Additive model: work history years (detailed) + additional history years (condensed)
    const workYears = params.years ?? profile?.workHistoryYears ?? RESUME_CONFIG.defaultWorkHistoryYears;
    const additionalYears = params.additional ?? profile?.additionalHistoryYears ?? null;

    // Total visible years = workYears + additionalYears (if set)
    const totalYears = (additionalYears != null && additionalYears > 0)
        ? workYears + additionalYears
        : workYears;
    filteredWork = filterWorkByYears(filteredWork, totalYears);

    // Partition: jobs within workYears get full detail, the rest are condensed
    // Only partition when additionalHistoryYears is set and > 0
    const partitionCutoff = (additionalYears != null && additionalYears > 0) ? workYears : null;
    const { recentJobs, earlierJobs } = partitionJobs(filteredWork, partitionCutoff);

    // Filter skills by profile - skills appear if their tags include the profile name
    filteredSkills = filterSkillsByProfile(filteredSkills, profileName);

    // Skills format: URL param overrides profile setting
    const skillsFormat = params.format || profile?.skillsFormat || 'tags';

    return {
        filteredWork,
        filteredSkills,
        recentJobs,
        earlierJobs,
        profile,
        profileName,
        skillsFormat,
        params
    };
}
