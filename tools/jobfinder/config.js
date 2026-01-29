// JobFinder Configuration
// Job boards organized by category
// URL placeholders: {keyword}, {city}, {state}

const CONFIG = {
  categories: [
    {
      name: "General",
      sites: [
        {
          name: "LinkedIn",
          urls: {
            keyword: "https://www.linkedin.com/jobs/search/?keywords={keyword}",
            location: "https://www.linkedin.com/jobs/search/?keywords={keyword}&location={city}%2C%20{state}",
            remote: "https://www.linkedin.com/jobs/search/?keywords={keyword}&f_WT=2"
          }
        },
        {
          name: "Indeed",
          urls: {
            keyword: "https://www.indeed.com/jobs?q={keyword}",
            location: "https://www.indeed.com/jobs?q={keyword}&l={city}%2C%20{state}",
            remote: "https://www.indeed.com/jobs?q={keyword}&l=remote"
          }
        },
        {
          name: "Glassdoor",
          urls: {
            keyword: "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keyword}",
            location: "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keyword}&locT=C&locKeyword={city}%2C%20{state}",
            remote: "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keyword}&remoteWorkType=1"
          }
        },
        {
          name: "ZipRecruiter",
          urls: {
            keyword: "https://www.ziprecruiter.com/jobs-search?search={keyword}",
            location: "https://www.ziprecruiter.com/jobs-search?search={keyword}&location={city}%2C%20{state}",
            remote: "https://www.ziprecruiter.com/jobs-search?search={keyword}&location=Remote%20%28USA%29"
          }
        },
        {
          name: "Monster",
          urls: {
            keyword: "https://www.monster.com/jobs/search?q={keyword}",
            location: "https://www.monster.com/jobs/search?q={keyword}&where={city}%2C%20{state}",
            remote: "https://www.monster.com/jobs/search?q={keyword}&where=remote"
          }
        },
        {
          name: "CareerBuilder",
          urls: {
            keyword: "https://www.careerbuilder.com/jobs?keywords={keyword}",
            location: "https://www.careerbuilder.com/jobs?keywords={keyword}&location={city}%2C%20{state}",
            remote: "https://www.careerbuilder.com/jobs?keywords={keyword}&cb_workhome=remote"
          }
        },
        {
          name: "SimplyHired",
          urls: {
            keyword: "https://www.simplyhired.com/search?q={keyword}",
            location: "https://www.simplyhired.com/search?q={keyword}&l={city}%2C%20{state}",
            remote: "https://www.simplyhired.com/search?q={keyword}&l=remote"
          }
        }
      ]
    },
    {
      name: "Tech",
      sites: [
        {
          name: "Dice",
          urls: {
            keyword: "https://www.dice.com/jobs?q={keyword}",
            location: "https://www.dice.com/jobs?q={keyword}&location={city}%2C%20{state}",
            remote: "https://www.dice.com/jobs?q={keyword}&filters.workplaceTypes=Remote&filters.isRemote=true"
          }
        },
        {
          name: "Built In",
          urls: {
            keyword: "https://builtin.com/jobs?search={keyword}",
            location: "https://builtin.com/jobs/office?search={keyword}&city={city}&state={state}&country=USA&allLocations=true",
            remote: "https://builtin.com/jobs/remote?search={keyword}&allLocations=true"
          }
        },
        {
          name: "Stack Overflow",
          urls: {
            keyword: "https://stackoverflowjobs.com/?q={keyword}",
            location: "https://stackoverflowjobs.com/?q={keyword}&l={city}%2C%20{state}",
            remote: "https://stackoverflowjobs.com/?q={keyword}&r=true"
          }
        },
        {
          name: "Crunchboard",
          urls: {
            keyword: "https://www.crunchboard.com/jobs/search?q={keyword}",
            location: "https://www.crunchboard.com/jobs/search?q={keyword}&location={city}%2C%20{state}",
            remote: "https://www.crunchboard.com/jobs/search?q={keyword}&l=Remote&remote=full"
          }
        }
      ]
    },
    {
      name: "Remote",
      sites: [
        {
          name: "RemoteOK",
          urls: {
            keyword: "https://remoteok.com/?search={keyword}"
          }
        },
        {
          name: "Working Nomads",
          urls: {
            keyword: "https://www.workingnomads.com/jobs?tag={keyword}"
          }
        },
        {
          name: "JustRemote",
          urls: {
            keyword: "https://justremote.co/remote-jobs?search={keyword}"
          }
        }
      ]
    },
    {
      name: "Startup",
      sites: [
        {
          name: "The Muse",
          urls: {
            keyword: "https://www.themuse.com/search/keyword/{keyword}",
            location: "https://www.themuse.com/search/location/{city}-{state}/keyword/{keyword}",
            remote: "https://www.themuse.com/search/keyword/{keyword}/flexible/true"
          }
        },
        {
          name: "Idealist",
          urls: {
            keyword: "https://www.idealist.org/en/jobs?q={keyword}",
            location: "https://www.idealist.org/en/jobs?q={keyword}&location={city}%2C%20{state}",
            remote: "https://www.idealist.org/en/jobs?q={keyword}&locationType=REMOTE"
          }
        },
        {
          name: "VentureLoop",
          urls: {
            keyword: "https://www.ventureloop.com/ventureloop/job_search.php?g=0&kword={keyword}&jcat=%25&dc=all&ldata=%25&jt=1&d=5&btn=1",
            location: "https://www.ventureloop.com/ventureloop/job_search.php?g=0&kword={keyword}&jcat=%25&dc=all&ldata={city},%20{state},%20US&jt=1&d=5&btn=1",
            remote: "https://www.ventureloop.com/ventureloop/job_search.php?g=0&kword={keyword}&jcat=%25&dc=all&ldata=%25&jt=1&remote=work_remotely&d=5&btn=1"
          }
        }
      ]
    }
  ]
};
