var $links = $('#links'); 
var slice = "control";


var storePages = [
	"papajohns.com",
	"pizzahut.com",
	"dominos.au",
	"hollister.com",
	"academy.com",
	"showcarnival.com",
	"partycity.com",
	"olivegarden.com",
	"souplantation.com",
	"dunkindonuts.com",
	"marcos.com",
	"yankeecandle.com",
	"gymboree.com",
	"chipotle.com",
	"donatos.com",
	"americangirl.com"];



var pages = {};


// Function to add arrays as sections to pages object
function addSection(pre,section,sub,list){
	pages[section] = {};
	pages[section].security = $('input[name="http"]:checked').val(); // Assign security via radio button
	pages[section].pre = pre;
	pages[section].env = $('input[name="env"]:checked').val(); // Assign evn via radio button
	pages[section].sub = sub;
	pages[section].list = list;
	pages[section].slice = "test";//$('#slice').val();
	
	
}

function update(){
	$links.empty(); // Clear Existing Links
	slice = $('#slice').val() || slice;
	pages = {};


	addSection("m", "Normal Pages","view/",storePages);
	addSection("m", "Amp Pages","amp/view/",storePages);



	// Taverse Pages object, putting url arrays into pageType
	for (pageType in pages){
		$links.append(
		"<h1>" +
		pageType + " (slice: " +slice + ")" + 
		"</h1>"
		);



		// Traverse pageType Array, turning urls into links + slice
		for (var i = 0; i < pages[pageType].list.length; i++){
			
			var link =
			pages[pageType].security +
			pages[pageType].pre + 
			pages[pageType].env +
			pages[pageType].sub +
			pages[pageType].list[i];

			$links.append(
			"<a target=\"_blank\" href=\"" +
			link + "?refresh=1" +
			"&slice=" + slice + "\">" + link +
			"</a><br>");
		}
	}
}

update();

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