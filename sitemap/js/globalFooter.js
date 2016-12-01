var $sections = $('#sections'); 
// var $json = $('#json'); 

// Environment Variables
var slice = "control";
var env = "rmntest.com";
var security = "https://";

var findDeals = [
	"sitemap",
	"ideas/cybermonday",
	"ideas/blackfriday"];

var waysToSave = [
	"submit",
	"mobile",
	"categories"];

var information = [	
	"corp",
	"static/terms",
	"static/privacy",
	"static/privacy#ad-choices",
	"blog"];

var connect = [	
	""
];

addSection("www", "Find Deals","",findDeals);
addSection("www", "Ways to Save","",waysToSave);
addSection("www", "Information","",information);
addSection("help", "Connect","",connect);

// Main object that will hold entire set of links
var page = {sections:{}};

// Function to add arrays as sections to pages object
function addSection(pre,section,sub,list){
	page.sections[section] = {};
	page.sections[section].pre = pre;
	page.sections[section].sub = sub;
	page.sections[section].list = list;
}

// Creates a URL from security, prefix, environment, subdirectory, storelist
function buildURL(pageSection, list){
	var link = 	security +
			pageSection.pre + 
			env +
			pageSection.sub +
			list;
			return link;
}

// Creates HTML for a link from a URL
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
function makeHeader(pageSection, slice){
	return "<h2>" + pageSection + " (slice: " + slice + ")" + "</h2>";
}



function update(){
	$sections.empty(); // Clear Existing Links

	// Check form and adjust properties
	slice = $('#slice').val() || slice;
	env = $('input[name="environment"]:checked').val(); // Assign evn via radio button
	security = $('input[name="http"]:checked').val(); // Assign security via radio button

	// Taverse Pages.sections object, putting url arrays into pageSection
	for (pageSection in page.sections){
		$sections.append(makeHeader(pageSection,slice));

		// Traverse pageSection.list Array, turning urls into links + slice
		for (var i = 0; i < page.sections[pageSection].list.length; i++){

			var url = buildURL(page.sections[pageSection],page.sections[pageSection].list[i]);

			// Special Case for 'view/' pages (add landing pages)
			if (page.sections[pageSection].sub == "view/"){
				$sections.append(makeLink(url,"",true));

				for (sub in landingPages){
					page.sections[pageSection].sub = landingPages[sub];
					var url = buildURL(page.sections[pageSection],page.sections[pageSection].list[i]);
					$sections.append(makeLink(url,"("+landingPages[sub]+")",true));
				}

				$sections.append("<br>");
				page.sections[pageSection].sub = "view/";
			
			// else just add link 	
			} else {
				$sections.append(makeLink(url));
			}
		};
	}
};

// Runs update() for the first time to initialize page
update();

// buttons
//$('#update').on('click', update);
$('form').on('change', update);

// Prevent enter from submitting form, run update() instead
$('#environment').on('keyup keypress', function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) { 
    e.preventDefault();
    update();
    return false;
  }
});

//debugging

// function updateJSON(){
// 		console.log(JSON.stringify(page, 1, '  '));
// };

// updateJSON();
