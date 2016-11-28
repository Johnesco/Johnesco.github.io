


var $links = $('#links'); 
// var $json = $('#json'); 
var slice = "control";

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


var pages = {};


// Function to add arrays as sections to pages object
function addSection(pre,section,sub,list){
	pages[section] = {};
	pages[section].security = $('input[name="http"]:checked').val(); // Assign security via radio button
	pages[section].pre = pre;
	pages[section].env = $('input[name="env"]:checked').val(); // Assign evn via radio button
	pages[section].sub = sub;
	pages[section].list = list;
	pages[section].slice = $('#slice').val();
	
}

function update(){
	$links.empty(); // Clear Existing Links
	slice = $('#slice').val() || slice;
	pages = {};

	function buildURL(pagesPageType, i){
		link = 	
			pagesPageType.security +
			pagesPageType.pre + 
			pagesPageType.env +
			pagesPageType.sub +
			pagesPageType.list[i];
		return link;
	}

	// Always add these sections
	addSection("www", "Find Deals","",findDeals);
	addSection("www", "Ways to Save","",waysToSave);
	addSection("www", "Information","",information);
	addSection("help", "Connect","",connect);


	// Taverse Pages object, putting url arrays into pageType
	for (pageType in pages){
		$links.append(
		"<h1>" +
		pageType + " (slice: " +slice + ")" + 
		"</h1>"
		);


		// Traverse pageType.list Array, turning urls into links + slice
		for (var i = 0; i < pages[pageType].list.length; i++){

			var link = buildURL(pages[pageType],i);


			if (pageType == "Store Pages"){

				$links.append(
				"<b><a target=\"_blank\" href=\"" +
				link + "?refresh=1" +
				"&slice=" + slice + "\">" + link +
				"</a></b>&nbsp;");


				for (sub in landingPages){
					pages[pageType].sub = landingPages[sub];
					var link = buildURL(pages[pageType],i);
					$links.append(
					"<a target=\"_blank\" href=\"" +
					link + "?refresh=1" +
					"&slice=" + slice + "\">" + "(" + landingPages[sub] + ")" +
					"</a>&nbsp;");
				}

				$links.append("<br>");
				pages[pageType].sub = "view/";
				


			} else {
				$links.append(
				"<a target=\"_blank\" href=\"" +
				link + "?refresh=1" +
				"&slice=" + slice + "\">" + link +
				"</a><br>");
			}


		};
			
		
	}
};

// function updateJSON(){
// 	$json.empty(); // Clear Existing Links
// 	$json.append(
// 		"<pre>" +
// 		JSON.stringify(pages, 1, '  ') +
// 		"</pre>"
// 		);
// };

update();

// updateJSON();

// buttons
$('#update').on('click', update);

// Prevent enter from submitting form, run update() instead
$('#env').on('keyup keypress', function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) { 
    e.preventDefault();
    update();
    return false;
  }
});