// Splits array into oxford comma seprated string.
function oxfordComma(array){
  var keywords = "";
  array.forEach(function(word, index) {
          if (index == array.length - 1) {
              keywords += " and " + word + ".";
          } else {
              keywords += word + ", ";
          }
      });
  return keywords;
}

// Take resumeJSON sub-object and returns a String
function skillSets(skills) {
  // Empty string to build into return value
  var skillSetsString = '';
  // Iterate over skills sub-object
  skills.forEach(function(skill) {
      // Convert array of keywords into comma separated string
      var keywords = oxfordComma(skill.keywords);
      
      skillSetsString += `<div class='col-lg-6 skillset'>
    <p><strong>${skill.name}: </strong>${keywords}</div>`;
  })
  return skillSetsString;
}

// Takes resumeJSON sub-object and returns a String
function jobList(work){
  
  var workString = '';
  work.forEach(function(job) {

    var jobHighlights = '';
    for(let highlight of job.highlights){
        jobHighlights += `<li>${highlight}</li>`;
    };
  
workString +=
`<div class='job'>
  <div class='row job-heading'>
    <div class='col-md-6'>
      <h3 class='job-company'>${job.company}:</h3>
    </div>
    <div class='col-md-6 text-md-right'>
    <p><span class='job-position'>${job.position}</span><br>
    <span class='job-date'>${job.startDate} to ${job.endDate}</span></p>
    </div>
</div>
<div class = 'row'>
  <div class='col-lg-4 col-md-6 col-sm-12'><p>${job.summary}</p></div>
  <div class='col-lg-8 col-md-6 col-sm-12'><ul>${jobHighlights}</ul></div>
</div></div>`;


})
  return workString;
}

// Takes resumeJSON sub-object and returns a String
function eduList(education){
  
  var educationString = '';
  
  education.forEach(function(school) {
    educationString +=
      `<div class='col-md-6 institution'>
      <dl>
      <dt class='school-title'> ${school.institution}: ${school.startDate} - ${school.endDate} </dt>
      <dd>${school.area}</dd>
      </dl></div>`;
})

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


