/**
 * Resume Configuration - Default view settings
 * Edit these values to change what appears by default (when no URL query params are specified)
 */

const RESUME_CONFIG = {
    // Number of years of work history to show by default
    // Set to 0 or a high number (e.g., 99) to show all jobs
    defaultYears: 15,

    // Default tags to filter by (array of strings, or null to show all)
    // Example: ['healthcare', 'lead'] would only show jobs with those tags
    defaultTags: null,

    // Tags to exclude from default view (array of strings, or null to exclude none)
    // Jobs with ANY of these tags will be hidden unless explicitly requested via URL
    excludeTags: ['performer'],

    // Default skill categories to show (array of strings, or null to show all)
    // Example: ['programming', 'cloud'] would only show matching skill categories
    defaultSkills: null,

    // Maximum years value before treating as "show all"
    // If a years filter exceeds this, no date filtering is applied
    maxYearsThreshold: 50
};
