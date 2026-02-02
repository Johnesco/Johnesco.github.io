// Splits array into oxford comma seprated string.
function oxfordComma(array){
  var keywords = "";
  array.forEach(function(word, index) {
          if (index == array.length - 1) {
              keywords += "and " + word + ".";
          } else {
              keywords += word + ", ";
          }
      });
  return keywords;
}

function skillUL(array){
  var keywords = "";
  array.forEach(function(word, index) {
          
              keywords += "<li>" + word + "</li>";
          
      });
  keywords = "<ul>" + keywords + "</ul>";
  return keywords;
}


// Take resumeJSON sub-object and returns a String
function skillSets(skills) {
  // Empty string to build into return value
  var skillSetsString = '';
  // Iterate over skills sub-object
  skills.forEach(function(skill) {
      // Convert array of keywords into comma separated string
      var keywords = skillUL(skill.keywords);
      
      skillSetsString += `<div class='col-md-6 skillset'>
    <p><strong>${skill.name}:</strong><br>${keywords}</div>`;
  });
  return skillSetsString;
}

// Takes resumeJSON sub-object and returns a String
function jobList(work){
  
  var workString = '';
  work.forEach(function(job) {

    var jobHighlights = '';
    // Loop through each highlight, creating new UL if leading space found
    for(let highlight of job.highlights){
    	if (highlight.charAt(0) == " "){
    	jobHighlights += `</ul><ul>`;
    	jobHighlights += `<li>${highlight.substring(1)}</li>`;
    	}else{
        jobHighlights += `<li>${highlight}</li>`;
        }
    }
  
workString +=
`<div class='job col-md-12'>
  <div class='row job-heading'>
    <div class='col-md-6'>
      <h3 class='job-company'><a href="${job.website}">${job.name}</a>:</h3>
    </div>
    <div class='col-md-6 text-md-end'>
    <p><span class='job-position'>${job.position}</span><br>
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

// <div class='col-lg-4 col-md-6 col-sm-12'><p>${job.summary}</p></div>

});
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


