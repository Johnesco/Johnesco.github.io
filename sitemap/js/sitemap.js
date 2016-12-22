var $content = $('#content'); 
// var $json = $('#json'); 

// Environment Variables
var slice = "control";
var env = "rmntest.com";
var security = "https://";

// Main object that will hold entire set of links
var contentObject = {sections:{}};

// Add section from JSON
addSectionJSON(homePage);
addSectionJSON(homePageLinks);
addSectionJSON(footerLinks);
addSectionJSON(CostCoPages);
addSectionJSON(communityPages);
addSectionJSON(communityPagesIe);
addSectionJSON(searchPages);
addSectionJSON(storePages);
addSectionJSON(testEnvPages);
addSectionJSON(ideaPages);
addSectionJSON(dealsPages);
addSectionJSON(categoryPages);
addSectionJSON(giftcardPages);
addSectionJSON(miscPages);
addSectionJSON(studentAffinityPagesTest);
addSectionJSON(colorAffinityPagesTest);
addSectionJSON(deprecatedPages);

// Function to add JSON sections to contentObject
function addSectionJSON(section){
	contentObject.sections[section.sectionName] = section;
	delete contentObject.sections[section.sectionName].sectionName;
}

// Creates HTML for a Header Section
function makeHeader(contentSection, slice){
	return "<h2>" + contentSection + " (slice: " + slice + ")" + "</h2>";
}

// Creates HTML link with ?refresh and &slice from a URL
// If nobr is false or absent, a <br> is added after link
// If nobr is true, no <br> is added after link
function makeAnchor(url,label,nobr){
	// If no label is provided, use URL as label
	var label = label || url;

	// Combine abel and url into an achor tag
	var url = "<a target=\"_blank\" href=\"" +
			url + "?refresh=1" +
			"&slice=" + slice + "\">" +
			label +
			"</a> ";

	// if 
	if (!nobr) url+= "<br>";
			return url;
}

// function makeAnchor(sect){
// 	var url = security + sect.pre + env + sect.sub + sect.endPoints[endPoint];
// 	$content.append(makeLink(url));
// };

function update(){
	$content.empty(); // Clear Existing Links

	// Get latest settings on form buttons and fields
	slice = $('#slice').val() || slice; // Get slice from text field
	env = $('input[name="environment"]:checked').val(); // Assign evn via radio button
	security = $('input[name="http"]:checked').val(); // Assign security via radio button

	// Taverse Pages.sections object, putting url arrays into pageSection
	for (section in contentObject.sections){

		// Check the Scope of the section
		// Skips if it doesn't match
		// no scope = always render
		var scope = contentObject.sections[section].scope;
		if (scope) {
			if (!env.includes(scope)) continue;
		} 

		// Add a header to the page based on section name
		$content.append(makeHeader(section,slice));

		// endpoint = index of content.sections[contentSection].endPoints
		for (endPoint in contentObject.sections[section].endPoints){

			// If the section is not a storepage, it just adds the link
			if (contentObject.sections[section].sub !== "view/"){
				var sect = contentObject.sections[section];
				var url = security + sect.pre + env + sect.sub + sect.endPoints[endPoint];
				$content.append(makeAnchor(url));

			// Special Case for 'view/' pages (add landing pages)
			} else {

				// Adds the first link with url
				var sect = contentObject.sections[section];
				var url = security + sect.pre + env + sect.sub + sect.endPoints[endPoint];
				$content.append(makeAnchor(url,"",true));

				// adds remaining links of landing, landing2.... with a short label
				for (sub in landingPages){
					sect.sub = landingPages[sub];
					var url = security + sect.pre + env + sect.sub + sect.endPoints[endPoint];
					
					$content.append("- "+makeAnchor(url,landingPages[sub],true));
				}

				// End of landing case
				$content.append("<br>"); // since nobr was true
				contentObject.sections[section].sub = "view/"; // change back for next loop
			}
		};
	}
};

// Run update() for the first time to initialize page
update();

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
