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
    maxYearsThreshold: 50,

    // Role profiles for ATS optimization
    // Activate via ?profile=qa-lead
    profiles: {
        "qa-lead": {
            summaryKey: "qa-lead",
            labelKey: "qa-lead",
            // Skill categories to show (in priority order, max 6 recommended)
            prioritySkills: [
                "Testing Methodologies & Frameworks",
                "Test Management & Documentation",
                "Leadership & Process",
                "Business Analysis",
                "Platforms & Environments",
                "Tools & Technologies"
            ],
            // Jobs older than this many years get condensed to one-liners
            earlierExperienceYears: 10,
            // "list" = ATS-friendly comma-separated, "tags" = pill boxes (default)
            skillsFormat: "list",
            // Tags to exclude when this profile is active
            excludeTags: ["performer", "admin", "creative"]
        },
        "business-analyst": {
            summaryKey: "business-analyst",
            labelKey: "business-analyst",
            prioritySkills: [
                "Business Analysis",
                "Problem-Solving & Analysis",
                "Leadership & Process",
                "Testing Methodologies & Frameworks",
                "Interpersonal & Collaboration",
                "Tools & Technologies"
            ],
            earlierExperienceYears: 10,
            skillsFormat: "list",
            excludeTags: ["performer", "admin", "creative", "gaming"]
        }
    }
};
