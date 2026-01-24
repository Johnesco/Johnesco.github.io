// JobFinder Configuration
// Job boards organized by category

const CONFIG = {
  categories: [
    {
      name: "General",
      sites: [
        { name: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords={keyword}" },
        { name: "Indeed", url: "https://www.indeed.com/jobs?q={keyword}" },
        { name: "Glassdoor", url: "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keyword}" },
        { name: "ZipRecruiter", url: "https://www.ziprecruiter.com/jobs-search?search={keyword}" },
        { name: "Monster", url: "https://www.monster.com/jobs/search?q={keyword}" },
        { name: "CareerBuilder", url: "https://www.careerbuilder.com/jobs?keywords={keyword}" },
        { name: "SimplyHired", url: "https://www.simplyhired.com/search?q={keyword}" },
        { name: "Google Jobs", url: "https://www.google.com/search?q={keyword}+jobs&ibp=htl;jobs" },
        { name: "USAJobs", url: "https://www.usajobs.gov/Search/Results?k={keyword}" },
        { name: "Snagajob", url: "https://www.snagajob.com/search?w={keyword}" }
      ]
    },
    {
      name: "Tech",
      sites: [
        { name: "Dice", url: "https://www.dice.com/jobs?q={keyword}" },
        { name: "Built In", url: "https://builtin.com/jobs?search={keyword}" },
        { name: "Wellfound", url: "https://wellfound.com/jobs?query={keyword}" },
        { name: "Stack Overflow", url: "https://stackoverflowjobs.com/?q={keyword}" },
        { name: "Crunchboard", url: "https://www.crunchboard.com/jobs?q={keyword}" },
        { name: "Authentic Jobs", url: "https://authenticjobs.com/?search={keyword}" }
      ]
    },
    {
      name: "Remote",
      sites: [
        { name: "FlexJobs", url: "https://www.flexjobs.com/search?search={keyword}" },
        { name: "Remote.co", url: "https://remote.co/remote-jobs/search/?search_keywords={keyword}" },
        { name: "We Work Remotely", url: "https://weworkremotely.com/remote-jobs/search?term={keyword}" },
        { name: "RemoteOK", url: "https://remoteok.com/remote-{keyword}-jobs" },
        { name: "Working Nomads", url: "https://www.workingnomads.com/jobs?tag={keyword}" },
        { name: "JustRemote", url: "https://justremote.co/remote-jobs?search={keyword}" },
        { name: "Remotive", url: "https://remotive.com/remote-jobs/search?text={keyword}" }
      ]
    },
    {
      name: "Startup",
      sites: [
        { name: "AngelList", url: "https://wellfound.com/jobs?query={keyword}" },
        { name: "The Muse", url: "https://www.themuse.com/search?keyword={keyword}" },
        { name: "Idealist", url: "https://www.idealist.org/en/jobs?q={keyword}" },
        { name: "Y Combinator", url: "https://www.workatastartup.com/jobs?query={keyword}" },
        { name: "VentureLoop", url: "https://www.ventureloop.com/ventureloop/job_search.php?keywords={keyword}" }
      ]
    }
  ]
};
