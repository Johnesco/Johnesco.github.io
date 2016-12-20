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

// Creates HTML link with ?refresh and &slice from a URL
function makeLink(url,label,nobr){
	var label = label || url;
	var url = "<a target=\"_blank\" href=\"" +
			url + "?refresh=1" +
			"&slice=" + slice + "\">" +
			label +
			"</a> ";
			if (!nobr) url+= "<br>";
			return url;
}

// Creates HTML for a Header Section
function makeHeader(contentSection, slice){
	return "<h2>" + contentSection + " (slice: " + slice + ")" + "</h2>";
}

function update(){
	$content.empty(); // Clear Existing Links

	// Check form and adjust global properties
	slice = $('#slice').val() || slice;
	env = $('input[name="environment"]:checked').val(); // Assign evn via radio button
	security = $('input[name="http"]:checked').val(); // Assign security via radio button

	// Taverse Pages.sections object, putting url arrays into pageSection
	for (section in contentObject.sections){

		// Continue to next section if it's not in the currenly selected env
		var scope = contentObject.sections[section].scope;
		if (scope) {
			if (!env.includes(scope)) continue;
		} 

		// Add a header to the page based on section name
		$content.append(makeHeader(section,slice));

		// Page = index of content.sections[contentSection].endPoints
		for (page in contentObject.sections[section].endPoints){

			// Special Case for 'view/' pages (add landing pages)
			if (contentObject.sections[section].sub == "view/"){
				var sect = contentObject.sections[section];
				var url = security + sect.pre + env + sect.sub + sect.endPoints[page];
				$content.append(makeLink(url,"",true));

				// changes contentObject.sections[section].sub from "view" to landing, landing2....
				for (sub in landingPages){
					sect.sub = landingPages[sub];
					var url = security + sect.pre + env + sect.sub + sect.endPoints[page];
					$content.append(makeLink(url,"("+landingPages[sub]+")",true));
				}

			// End of landing case
			$content.append("<br>");
			contentObject.sections[section].sub = "view/"; // change back for next loop

			
			// else just add link 	
			} else {
				var sect = contentObject.sections[section];
				var url = security + sect.pre + env + sect.sub + sect.endPoints[page];
				$content.append(makeLink(url));
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
