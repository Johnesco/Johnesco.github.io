


var $content = $('#content'); 
// var $json = $('#json'); 

// Environment Variables
var slice = "control";
var env = "rmntest.com";
var security = "https://";

// Main object that will hold entire set of links
var contentObject = {sections:{}};

// Function to add arrays as sections to contentObject
function addSection(pre,section,sub,list){
	contentObject.sections[section] = {};
	contentObject.sections[section].pre = pre;
	contentObject.sections[section].sub = sub;
	contentObject.sections[section].list = list;
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

// Add these sections into page object
addSection("www", "Home Pages Links","",homePageLinks);
addSection("www", "CostCo (New Community)", "", CostCoPages);
addSection("www", "Search Pages", "s/", searchPages);
addSection("www", "Community Pages", "community/", communityPages);
addSection("www", "Store Pages","view/",storePages);
addSection("www", "Ideas Pages","ideas/",ideaPages);
addSection("www", "Category Pages", "coupons/", categoryPages);
addSection("giftcards", "GiftCard Pages", "store/", giftcardPages);
addSection("www", "Student Affinity Pages", "student-discounts/", studentAffinityPagesTest);
addSection("www", "Misc Pages", "", miscPages);
addSection("www", "Test Env Only", "view/", testEnvPages);

function update(){
	$content.empty(); // Clear Existing Links

	// Check form and adjust properties
	slice = $('#slice').val() || slice;
	env = $('input[name="environment"]:checked').val(); // Assign evn via radio button
	security = $('input[name="http"]:checked').val(); // Assign security via radio button

	// Taverse Pages.sections object, putting url arrays into pageSection
	for (section in contentObject.sections){
		$content.append(makeHeader(section,slice));

		// Page = index of content.sections[contentSection].list
		for (page in contentObject.sections[section].list){

			// Special Case for 'view/' pages (add landing pages)
			if (contentObject.sections[section].sub == "view/"){
				var sect = contentObject.sections[section];
				var url = security + sect.pre + env + sect.sub + sect.list[page];
				$content.append(makeLink(url,"",true));

				// changes contentObject.sections[section].sub from "view" to landing, landing2....
				for (sub in landingPages){
					sect.sub = landingPages[sub];
					var url = security + sect.pre + env + sect.sub + sect.list[page];
					$content.append(makeLink(url,"("+landingPages[sub]+")",true));
				}

			// End of landing case
			$content.append("<br>");
			contentObject.sections[section].sub = "view/"; // change back for next loop

			
			// else just add link 	
			} else {
				// var url = buildURL(contentObject.sections[section],contentObject.sections[section].list[page]);
				var sect = contentObject.sections[section];
				var url = security + sect.pre + env + sect.sub + sect.list[page];
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
		console.log(JSON.stringify(content, 1, '  '));
};

updateJSON();
