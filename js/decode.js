// Functions

// Decodes a URL
function decode () {
	var uri = textBox.value;
	textBox.value = decodeURIComponent(uri);
}

// Beautifies JSON
function beautify () {
	var json_object = JSON.parse(textBox.value);
	var pretty = JSON.stringify(json_object, 1, '  ');
	textBox.value = pretty;
}

// Parses the name-value pairs in a URL and formats them into JIRA markdown
function tablefy () {
	var string = "";
	var uri = URI.parseQuery(textBox.value);
		for (var key in uri) {
  		if (uri.hasOwnProperty(key)) {
    		string+=("|*" + key + ":* | " + uri[key] + " | \n");
  		}
	}
	textBox.value = string;
}

function unescape_text () {
	var text = textBox.value.replace(/\\"/g, '"');
	textBox.value = text;
}


// listeners
var textBox = document.getElementById("textBox");

var el = document.getElementById("decode");
el.addEventListener("click", decode);

var el = document.getElementById("tablefy");
el.addEventListener("click", tablefy);

var el = document.getElementById("beautify");
el.addEventListener("click", beautify);

var el = document.getElementById("unescape");
el.addEventListener("click", unescape_text);

