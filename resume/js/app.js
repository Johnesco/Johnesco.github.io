// Splits array into oxford comma seprated string.
function oxfordComma(array) {
  var keywords = "";
  array.forEach(function (word, index) {
    if (index == array.length - 1) {
      keywords += "and " + word + ".";
    } else {
      keywords += word + ", ";
    }
  });
  return keywords;
}

// Take YYYY-MM-DD format to MM-DD-YYYY

function USdate(inputDate) {
    // Split the input date into year, month, and day
    const parts = inputDate.split('-');
    
    // Check if the date is in the correct format (YYYY-MM-DD)
    if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD.');
    }
    
    // Reorder the parts to MM-DD-YYYY
    const formattedDate = `${parts[1]}-${parts[2]}-${parts[0]}`;
    
    return formattedDate;
}

// Take resumeJSON sub-object and returns a String
function skillSets(skills) {
  // Empty string to build into return value
  var skillSetsString = "";
  // Iterate over skills sub-object
  skills.forEach(function (skill) {
    // Convert array of keywords into comma separated string
    var keywords = oxfordComma(skill.keywords);

    skillSetsString += `<div class='col-md-6 skillset'>
    <p><strong>${skill.name}:</strong><br>${keywords}</div>`;
  });
  return skillSetsString;
}

// Takes resumeJSON sub-object and returns a String
function jobList(work) {
  var workString = "";
  work.forEach(function (job) {
    var jobHighlights = "";
    // Loop through each highlight, creating new UL if blank found
    for (let highlight of job.highlights) {
      if (highlight.charAt(0) == " ") {
        jobHighlights += `</ul><ul>`;
      } else jobHighlights += `<li>${highlight}</li>`;
    }
    job.startDate = (USdate(job.startDate));
    if (!job.endDate) { job.endDate = "Present";} 
    else
      {job.endDate = (USdate(job.endDate));}
    
    workString += `<div class='job col-md-12'>
  <div class='row job-heading'>
    <div class='col-md-7'>
      <h3 class='job-company'><a href="${job.website}">${job.name}</a>:</h3>
    </div>
    <div class='col-md-5 text-md-end'>
      <p>
      <span class='job-position'>${job.position}</span><br>
      <span class='job-date'>${job.startDate} to ${job.endDate}</span></p>
    </div>
    </div>
<div class = 'row'>
  <div class='col-md-8 col-sm-12'><p class='job-summary'>${job.summary}</p>
</div>
</div>
<div class='row'>
  <div class='col-sm-12'><h4 class="h6">Responsibilities and Accomplishments</h4><ul>${jobHighlights}</ul></div>
</div></div>`;
  });
  return workString;
}

// Takes resumeJSON sub-object and returns a String
function eduList(education) {
  var educationString = "";

  education.forEach(function (school) {
    educationString += `<div class='col-md-6 institution'>
      <dl>
      <dt class='school-title'> ${school.institution}: ${school.startDate} - ${school.endDate} </dt>
      <dd>${school.area}</dd>
      </dl></div>`;
  });

  return educationString;
}

$("span#name").text(resumeJSON.basics.name);
$("span#title").text(resumeJSON.basics.label);
$("p#summary").html(`<strong>Summary: </strong>${resumeJSON.basics.summary}`);
$("p#contact").html(`${resumeJSON.basics.email}<br>
    ${resumeJSON.basics.phone}<br>
    ${resumeJSON.basics.location.city}, ${resumeJSON.basics.location.postalCode}<br>`);
$("#skillSets").html(skillSets(resumeJSON.skills));
$("#jobs").html(jobList(resumeJSON.work));
$("#schools").html(eduList(resumeJSON.education));
