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

function skillSets(skills) {
  var skillSetsString = '-------- SKILLSETS --------<br>';
  skills.forEach(function(skill) { 
      var keywords = oxfordComma(skill.keywords);
      skillSetsString += `<br>${skill.name}:<br>${keywords}<br>`;
  });
  return skillSetsString + "<br>";
}

// Takes resumeJSON sub-object and returns a String
function jobList(work){
  
  var workString = '-------- WORK HISTORY --------<br><br>';
  work.forEach(function(job) {

    var jobHighlights = '';
    for(let highlight of job.highlights){
        jobHighlights += ` - ${highlight}<br>`;
    }
  
workString +=
`${job.name}:<br>
${job.position}<br>
${job.startDate} to ${job.endDate}<br><br>
${job.summary}<br><br>
${jobHighlights}<br>
-----------------------------------------<br>`;


});
  return workString;
}

function eduList(education){
  
  var educationString = '-------- EDUCATION --------<br>';
  
  education.forEach(function(school) {
    educationString +=
      `${school.institution}: ${school.startDate} - ${school.endDate} <br>
      ${school.area}<br><br>`;
});

  return educationString;
}


var textResume = "";

textResume += 
`<p>${resumeJSON.basics.name}<br>
${resumeJSON.basics.label}<br><br>
${resumeJSON.basics.email}<br>
${resumeJSON.basics.phone}<br>
${resumeJSON.basics.location.city}, ${resumeJSON.basics.location.postalCode}<br><br>

Summary: ${resumeJSON.basics.summary}<br><br>`;



textResume += skillSets(resumeJSON.skills);

textResume += jobList(resumeJSON.work);

textResume += eduList(resumeJSON.education);

textResume += "</p>";
/*



var eduList = "";
resumeJSON.education.forEach(function(school) {

    eduList +=
        "<div class='col-md-6 institution'>" +
        "<dl>" +
        "<dt class='school-title'>" + school.institution +  ": " +
        school.startDate + " - " + school.endDate + "</dt>" +
        "<dd>" + school.area + "</dd>" +
        "</dl>" +
        "</div>";


})

$("#schools").html(eduList);

*/
$('body').html(textResume);
