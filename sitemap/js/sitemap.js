var $content = $('#content'); 

// Default Environment Variables
var slice = "control";
var enviroment = "";
var security = "";

// Main object that will hold a compressed set of links
var contentObject = {};

// Add sections from JSON to contentObject, one time IIEF
(function addSectionsJSON(sections){
  for (section of sections){
    contentObject[section.sectionName] = section;
    delete contentObject[section.sectionName].sectionName;
  }
}(pageList));

// Real time check of values
function getSlice(){ return $('#slice').val() || slice;}
function getEnv(){ return $('input[name="environment"]:checked').val();}
function getSecurity(){ return $('input[name="http"]:checked').val();}

// Fires off update() anytime the form changes
function update(){
    // Cache Form Values
    slice = getSlice();
    environment = getEnv();
    security = getSecurity();

    $content.html(renderContent(contentObject));
}

// Renders sections of object into HTML
function renderContent(obj){
  var finalStr ='';

  for (section in obj){
    var scope = obj[section]['scope'];

    // only render sections in that match scope
    if (inScope(scope)){
      finalStr += renderSection(obj[section],section);
    }
  }

  return finalStr;
}

// Returns true if scope matches current environement
function inScope(scope){
  //var environment = getEnv();

  if (!scope) { return true }

  if (environment.includes(scope)) { return true } 

  return false;
}

// Recieves single section object and its name
// Creates the header and links for that section
// If it is a store page, landing - landing 5 links are added
// returns it as HTML string
function renderSection(section, sectionName){

  // endpoints in a section dictate the number of links to be made
  var endPoints = section['endPoints'];
  var sub = section['sub'];
  var linkList = [];

  if (sub == "view/"){
    // Special Case for Store Pages
    for (endPoint of endPoints){
      linkList.push(renderStoreLink(endPoint,section));
    }
  } else {
    // for other links
    for (endPoint of endPoints){
      linkList.push(renderLink(endPoint,section));
    }
  }

  // Convert array of links to HTML
  var links = '';
  for (link of linkList){
    links += link;
  }

  //I have a header, I have a list, UHH, section
  section = makeHeader(sectionName) + links;
  section = '<div class="section">' + section + '</div>';

  return section //string
}

// Recieves array of endPoints
// Returns link to store + landing pages
function renderStoreLink(endpoint,section){

  var pre = section['pre'];
  var sub = section['sub'];
  var StoreLink = '';

  var url = buildURL(pre,sub,endpoint);
  StoreLink += (makeAnchor(url)+" - ");

  url = buildURL(pre,"landing/",endpoint);
  StoreLink += (makeAnchor(url,"landing/")+" - ");

  url = buildURL(pre,"landing2/",endpoint);
  StoreLink += (makeAnchor(url,"landing2/")+" - ");

  url = buildURL(pre,"landing5/",endpoint);
  StoreLink += (makeAnchor(url,"landing5/")+"<br>");

  return StoreLink;
}

function renderLink(endpoint,section){
  var Link = '';
  var url = buildURL(section['pre'],section['sub'],endpoint);
  Link += (makeAnchor(url)+"<br>");
  return Link;
}

// Creates HTML for a Header Section
function makeHeader(str){
  return "<h2>" + str + " (slice: " + slice + ")" + "</h2>";
}

function buildURL(pre, sub, endpoint){
  return security + pre + environment + sub + endpoint;
}

// Creates HTML link with ?refresh and &slice from a URL
// If nobr is false or absent, a <br> is added after link
// If nobr is true, no <br> is added after link
function makeAnchor(url,label){
  // If no label is provided, use URL as label
  var label = label || url;

  // Combine abel and url into an achor tag
  var url = 
    '<a target="_blank" href="' + url + '?refresh=1' + '&slice=' + slice + '">' +
    label + '</a>';

  return url;
}

// Run for the first time to initialize page
update();

// Run update() after any change in form
$('form').on('change', update);

// Prevent enter from submitting form, run update() instead
$('form').on('keyup keypress', function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) { 
    e.preventDefault();
    update();
    //update();
    return false;
  }
});



// function updateJSON(){
//    console.log(JSON.stringify(contentObject, 1, '  '));
// };
// updateJSON();

