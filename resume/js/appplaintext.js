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

// Take YYYY-MM-DD format to MMM-YYYY
function USdate(inputDate) {
    // Split the input date using underscore as separator
    const parts = inputDate.split('-');
    
    // Check if the date is in the correct format (YYYY_MM_DD)
    if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
        throw new Error('Invalid date format. Please use YYYY_MM_DD.');
    }
    
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    // Array of month abbreviations
    /*const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];*/
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Convert month number to month name (subtract 1 because array is 0-indexed)
    const monthIndex = parseInt(month, 10) - 1;
    
    // Validate month number
    if (monthIndex < 0 || monthIndex > 11) {
        throw new Error('Invalid month. Month must be between 01 and 12.');
    }
    
    const monthName = monthNames[monthIndex];
    
    // Return formatted date as "Month Year" (e.g., "Jan 2023")
    return `${monthName} ${year}`;
}

function skillSets(skills) {
    var skillSetsString = "[ SKILL SETS ]<br>";
    skills.forEach(function (skill) {
        var keywords = oxfordComma(skill.keywords);
        skillSetsString += `<br>${skill.name}:<br>${keywords}<br>`;
    });
    return skillSetsString + "<br>";
}

// Takes resumeJSON sub-object and returns a String
function jobList(work) {
    var workString = "[ WORK EXPERIENCE ]<br><br>";
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

        workString += `
Company: ${job.name} | ${job.location}<br>
Position: ${job.position}<br>
From: ${job.startDate} to ${job.endDate}<br><br>
Position Summary:<br> ${job.summary}<br><br>
${jobHighlights}<br>
<br>`;
    });
    return workString;
}

function eduList(education) {
    var educationString = "[ EDUCATION ]<br><br>";

    education.forEach(function (school) {
        educationString += `Dates Attended: ${school.startDate} - ${school.endDate} <br>School Name: ${school.institution}<br>
      Area of Study: ${school.area}<br><br>`;
    });

    return educationString;
}

var textResume = "";

textResume += `
<p>Name: ${resumeJSON.basics.name}<br>
<p>Email: ${resumeJSON.basics.email}<br>
<p>Phone: ${resumeJSON.basics.phone}<br>
<p>Address:<br>
${resumeJSON.basics.location.address}<br>
${resumeJSON.basics.location.city}, ${resumeJSON.basics.location.region},${resumeJSON.basics.location.postalCode}<br><br>

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
