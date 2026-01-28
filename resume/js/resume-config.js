/**
 * Resume Configuration - Default view settings
 * Edit these values to change what appears by default (when no URL query params are specified)
 */

const RESUME_CONFIG = {
    // Number of years of work history to show by default
    // Set to 0 or a high number (e.g., 99) to show all jobs
    defaultYears: 15,

    // Maximum years value before treating as "show all"
    // If a years filter exceeds this, no date filtering is applied
    maxYearsThreshold: 50,

    // Default profile to use when no ?profile= parameter is specified
    // This should be one of the real profiles (not "default")
    defaultProfile: "qa-lead",

    // Role profiles - everything is profile-driven
    // Jobs and skills appear in a profile if their tags array includes the profile name
    // "all" profile shows everything regardless of tags
    // The defaultProfile setting above determines which profile is used when no ?profile= is specified
    profiles: {
        "all": {
            // Shows everything - all jobs, all skills, no date limits, no condensing
            summaryKey: "default",
            labelKey: "default",
            historyYears: 99,
            earlierExperienceYears: null,
            skillsFormat: "tags"
        },
        "qa-lead": {
            summaryKey: "qa-lead",
            labelKey: "qa-lead",
            historyYears: 20,
            // Jobs older than this many years get condensed to one-liners
            earlierExperienceYears: 10,
            // "list" = ATS-friendly comma-separated, "tags" = pill boxes (default)
            skillsFormat: "list"
        },
        "business-analyst": {
            summaryKey: "business-analyst",
            labelKey: "business-analyst",
            historyYears: 30,
            earlierExperienceYears: null,
            skillsFormat: "list"
        },
        "instructor": {
            summaryKey: "instructor",
            labelKey: "instructor",
            historyYears: 99,
            earlierExperienceYears: null,
            skillsFormat: "list"
        }
    }
};
