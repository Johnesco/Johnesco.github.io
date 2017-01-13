var $content = $('#content'); 
// var $json = $('#json'); 

// Default Environment Variables
var slice = "control";
var env = "rmntest.com/";
var security = "https://";

// Main object that will hold a compressed set of links
var contentObject = {};

// Add sections from JSON to contentObject, one time IIEF
(function addSectionsJSON(sections){
	for (section of sections){
		contentObject[section.sectionName] = section;
		delete contentObject[section.sectionName].sectionName;
	}
}(pageList));

function getSlice(){ return $('#slice').val() || slice;}
function getEnv(){ return $('input[name="environment"]:checked').val();}
function getSecurity(){ return $('input[name="http"]:checked').val();}

// Creates HTML for a Header Section
function makeHeader(str){
	return "<h2>" + str + " (slice: " + getSlice() + ")" + "</h2>";
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
			"&slice=" + getSlice() + "\">" +
			label +
			"</a> ";

			return url;
}

function buildURL(pre, sub, endpoint){
	return getSecurity() + pre + getEnv() + sub + endpoint;
}

function renderSection(section, sectionName){
	// recieves single section object and returns it as HTML
	var links = '';
	var linkList = [];

	// endpoints in a section dictate the number of links to be made
	var endPoints = section['endPoints'];

	if (section['sub'] == "view/"){
		// Special Case for Store Pages
		for (endPoint of section['endPoints']){
			var url = buildURL(section['pre'],section['sub'],endPoint);
			linkList.push(makeAnchor(url)+" - ");
			url = buildURL(section['pre'],"landing/",endPoint);
			linkList.push(makeAnchor(url,"landing/")+" - ");
			url = buildURL(section['pre'],"landing2/",endPoint);
			linkList.push(makeAnchor(url,"landing2/")+" - ");
			url = buildURL(section['pre'],"landing5/",endPoint);
			linkList.push(makeAnchor(url,"landing5/")+"<br>");
		}
	} else {
		// for other links
		for (endPoint of section['endPoints']){
			var url = buildURL(section['pre'],section['sub'],endPoint);
			linkList.push(makeAnchor(url)+"<br>");
		}
	}

	var header = makeHeader(sectionName);
	for (link of linkList){
		links += link;
	}
	section = header + links;
	section = '<div class="section">' + section + '</div>';

	return section //string
}

function renderContent(obj){
	// Content will be rendered to a string to be displayed as HTML
	finalStr = '';
	var environment = getEnv(); // cache value

	//processes content Object into a string of html and writes it to the page
	for(section in obj){

		// filter out sections that are not scoped to the current Env
		var scope = obj[section]['scope'];
		// if scope doesn't exist or doesn't match current Env, exit function
		// those that pass, put into an array
		if (scope) {
			if (!environment.includes(scope)) {continue;}
		} 
			finalStr +=(renderSection(obj[section],section));
	}

	$content.html(finalStr);
}

// Fires off renderContent from form clicks and updates
function displayPageTypes(){
		renderContent(contentObject);
}

// Run update() for the first time to initialize page
displayPageTypes();
//expandLinks();

// Run update() after any change in form
$('form').on('change', displayPageTypes);

// Prevent enter from submitting form, run update() instead
$('form').on('keyup keypress', function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) { 
    e.preventDefault();
    displayPageTypes();
    //update();
    return false;
  }
});

//debugging

function updateJSON(){
		console.log(JSON.stringify(contentObject, 1, '  '));
};

updateJSON();
