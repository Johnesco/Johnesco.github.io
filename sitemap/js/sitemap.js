var $content = $('#content'); 
// var $json = $('#json'); 

// Environment Variables
var slice = "control";
var env = "rmntest.com";
var security = "https://";

// Main object that will hold a compressed set of links
var contentObject = {};

// Add sections from JSON to contentObject
// One time IIEF
(function addSectionsJSON(sections){
	for (section of sections){
		contentObject[section.sectionName] = section;
		delete contentObject[section.sectionName].sectionName;
	}
}(pageList));

// Creates HTML for a Header Section
function makeHeader(contentSection, slice){
	return "<h2>" + contentSection + " (slice: " + slice + ")" + "</h2>";
}

// Creates HTML link with ?refresh and &slice from a URL
// If nobr is false or absent, a <br> is added after link
// If nobr is true, no <br> is added after link
function makeAnchor(url,label){
	// If no label is provided, use URL as label
	var label = label || url;

	// Combine abel and url into an achor tag
	var url = "<a target=\"_blank\" href=\"" +
			url + "?refresh=1" +
			"&slice=" + slice + "\">" +
			label +
			"</a> ";

			return url;
}

function expandLinks(){
	for (section in contentObject){
		var sect = contentObject[section];
		var endPoints = sect.endPoints;
		sect.links = [];
		for(endpoint of endPoints){
			sect.links.push(security + sect.pre + env + sect.sub + endpoint);
		}
	}
}

function update(){
	$content.empty(); // Clear Existing Links

	// Get latest settings on form buttons and fields
	slice = $('#slice').val() || slice; // Get slice from text field
	env = $('input[name="environment"]:checked').val(); // Assign evn via radio button
	security = $('input[name="http"]:checked').val(); // Assign security via radio button

	// Taverse Pages.sections object, putting url arrays into pageSection
	for (section in contentObject){

		// Check the Scope of the section
		// Skips if it doesn't match
		// no scope = always render
		var scope = contentObject[section].scope;
		if (scope) {
			if (!env.includes(scope)) continue;
		} 

		// Add a header to the page based on section name
		$content.append(makeHeader(section,slice));

		// endpoint = index of content.sections[contentSection].endPoints
		var ends = contentObject[section].endPoints;
		for (var endPoint in ends){

			// Cache these values for use in inner loops
			var sect = contentObject[section];
			var url = security + sect.pre + env + sect.sub + sect.endPoints[endPoint];

			// If the section is not a storepage, it just adds the link
			if (contentObject[section].sub !== "view/"){
				$content.append(makeAnchor(url));
				$content.append("<br>");

			// Special Case for 'view/' pages (add landing pages)
			} else {

				// Adds the first link with url
				$content.append(makeAnchor(url));

				// adds remaining links of landing, landing2.... with a short label
				for (sub of landingPages){
					sect.sub = sub;
					url = security + sect.pre + env + sect.sub + sect.endPoints[endPoint];
					$content.append("- "+makeAnchor(url,sub,true));
				}

				// End of landing case
				$content.append("<br>"); // since nobr was true
				sect.sub = "view/"; // change back for next loop
			}
		};
	}
};

// Run update() for the first time to initialize page
update();
expandLinks();

// Run update() after any change in form
$('form').on('change', update);

// Prevent enter from submitting form, run update() instead
$('form').on('keyup keypress', function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) { 
    e.preventDefault();
    update();
    return false;
  }
});

//debugging

function updateJSON(){
		console.log(JSON.stringify(contentObject, 1, '  '));
};

updateJSON();
