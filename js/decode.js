"use strict";

// Functions

// Decodes a URL
function decode() {
  textBox.value = decodeURIComponent(textBox.value);
  beautify();
}

// Beautifies JSON
function beautify() {
	var json_object = JSON.parse(textBox.value) || '{"none":"none"}';
	textBox.value = JSON.stringify(json_object, 1, '  ');
}


// Parses the name-value pairs in a URL and formats them into JIRA markdown
function tablefy() {
  var uri = URI.parseQuery(textBox.value);
  var string = "";
    for (var key in uri) {
      if (uri.hasOwnProperty(key)) {
        string+=("|*" + key + ":* | " + uri[key] + " | \n");
      }
    }
  textBox.value = string.replace("http://b.rmntest.com/", '');
};

function extractPayload() {
	textBox.value = jQuery.parseJSON(textBox.value).query.payload;
	beautify();
}

function extractJ() {
	textBox.value = jQuery.parseJSON(textBox.value).j;
	beautify();
}

function extractRequestBody() {
	textBox.value = jQuery.parseJSON(textBox.value).metadata.requestBody;
	decode();
	beautify();
}

function decodeJbeautify() {
	decode();
	extractJ();
	beautify();
}

function viewJsonTree() {
	var jjson = textBox.value || '{"none":"none"}';
	$("#jjson").jJsonViewer(jjson);
}



// listeners
var textBox = document.getElementById("textBox");

var output = document.getElementById("output");

var el = document.getElementById("decode");
el.addEventListener("click", decode);

var el = document.getElementById("tablefy");
el.addEventListener("click", tablefy);

var el = document.getElementById("beautify");
el.addEventListener("click", beautify);

var el = document.getElementById("extractPayload");
el.addEventListener("click", extractPayload)

var el = document.getElementById("extractJ");
el.addEventListener("click", extractJ);

var el = document.getElementById("extractRequestBody");
el.addEventListener("click", extractRequestBody);

var el = document.getElementById("decodeJbeautify");
el.addEventListener("click", decodeJbeautify);

var el = document.getElementById("viewJsonTree");
el.addEventListener("click", viewJsonTree);






