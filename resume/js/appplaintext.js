function oxfordComma(array) {
    var keywords = "";
    array.forEach(function (word, index) {
        if (index == array.length - 1) {
            keywords += " and " + word + ".";
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

function skillSets(skills) {
    var skillSetsString = "[ SKILLS ]<br>";
    skills.forEach(function (skill) {
        var keywords = oxfordComma(skill.keywords);
        skillSetsString += `<br>${skill.name}:<br>${keywords}<br>`;
    });
    return skillSetsString + "<br>";
}

// Takes resumeJSON sub-object and returns a String
function jobList(work) {
    var workString = "[ PROFESSIONAL EXPERIENCE ]<br><br>";
    work.forEach(function (job) {
        var jobHighlights = "";
        for (let highlight of job.highlights) {
            jobHighlights += ` * ${highlight}<br>`;
        }

        job.startDate = USdate(job.startDate);
        if (!job.endDate) {
            job.endDate = "Present";
        } else {
            job.endDate = USdate(job.endDate);
        }

        workString += `Company: ${job.name}:<br>
Position: ${job.position}<br>
Date: ${job.startDate} to ${job.endDate}<br><br>
Position Summary: ${job.summary}<br><br>
${jobHighlights}<br>
<br>`;
    });
    return workString;
}

function eduList(education) {
    var educationString = "[ EDUCATION ]<br>";

    education.forEach(function (school) {
        educationString += `${school.institution}: ${school.startDate} - ${school.endDate} <br>
      ${school.area}<br><br>`;
    });

    return educationString;
}

var textResume = "";

textResume += `<p>${resumeJSON.basics.name}<br>
${resumeJSON.basics.label}<br><br>
${resumeJSON.basics.email}<br>
${resumeJSON.basics.phone}<br>
${resumeJSON.basics.location.city}, ${resumeJSON.basics.location.postalCode}<br><br>

PROFESSIONAL SUMMARY: ${resumeJSON.basics.summary}<br><br>`;

textResume += skillSets(resumeJSON.skills);

textResume += jobList(resumeJSON.work);

textResume += eduList(resumeJSON.education);

textResume += "<p>For a more detailed and recent resume, go to https://johnesco.github.io/resume/</p>";

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
$("body").html(textResume);
