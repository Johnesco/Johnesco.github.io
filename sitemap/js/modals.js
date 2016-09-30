


var $links = $('#links'); 
var slice = "DTStorePage";
var username = "letmeshowyou";
var pizzaroute = "a/78745";
var pizzalocation = "ma/papajohns.com/78745";
var ideas = "hot-products";
var cid = "7450931";
var store = "storewithnoname.com";
var search = "bacon";
var affinityGroup = "student";
var unsubscribe = "&unsubscribe=U2PEHPOV6BB5NHU4SLPTCYNS7Q&ei=U2PEHPOV6BB5NHU4SLPTCYNS7Q&mailingid=18561&ESP=2&utm_medium=email&utm_campaign=2015_10_28&ch=newsl&utm_source=newsletter&utm_term=maleproductdeals&cus.ptp=flagship"

var modals = [
"8499999",
"8498962",
"8504197",
"8499838"]






var pages = {};

// Function to add arrays as sections to pages object
function addSection(list,section,prefix){
	pages[section] = [];
	for (var i = 0; i < list.length; i++){
		pages[section].push(prefix + list[i])
	}	
	// for (var i = 0; i < list.length; i++){
	// 	pages[section].push(prefix + list[i])
	// }
}

// Go though 
addSection(modals,"Modals","view/storewithnoname.com?c=");



function update(){
	$links.empty(); // Clear Existing Links
	slice = $('#slice').val() || "DTStorePageV2"; // Assign slice via input (default to control)
	var env = $('input[name="env"]:checked').val(); // Assign evn via radio button
	var security = $('input[name="http"]:checked').val(); // Assign security via radio button
	

	// Taverse Pages object, putting url arrays into pageType
	for (pageType in pages){
		$links.append(
		"<h1>" +
		pageType + " (slice: " +slice + ")" + 
		"</h1>"
		);

		// Traverse pageType Array, turning urls into links + slice
		for (var i = 0; i < pages[pageType].length; i++){
			var link = security + env + pages[pageType][i];
			$links.append(
			"<a target=\"_blank\" href=\"" + link + "&refresh=1" +
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


	

