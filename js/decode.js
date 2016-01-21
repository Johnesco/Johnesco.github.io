"use strict";

// Functions

// Decodes a URL
function decode() {
  textBox.value = decodeURIComponent(textBox.value);
}

// Beautifies JSON
function beautify() {
	var json_object = JSON.parse(textBox.value) || "{}";
	textBox.value = JSON.stringify(json_object, 1, '  ');
}

// Parses the name-value pairs in a URL and formats them into JIRA markdown
function tablefy() {
  var string = "";
  var uri = URI.parseQuery(textBox.value);
    for (var key in uri) {
      if (uri.hasOwnProperty(key)) {
        string+=("|*" + key + ":* | " + uri[key] + " | \n");
      }
    }
  textBox.value = string;
};

function unescapeText() {
	textBox.value = textBox.value.replace(/\\"/g, '"');
}

function extractPayload() {
	textBox.value = jQuery.parseJSON(textBox.value).query.payload;
}

function extractJ() {
	textBox.value = jQuery.parseJSON(textBox.value).j;
}

function extractRequestBody() {
	textBox.value = jQuery.parseJSON(textBox.value).metadata.requestBody;
}

function decodeJbeautify() {
	decode();
	extractJ();
	beautify();
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

var el = document.getElementById("unescape");
el.addEventListener("click", unescapeText);

var el = document.getElementById("extractPayload");
el.addEventListener("click", extractPayload)

var el = document.getElementById("extractJ");
el.addEventListener("click", extractJ);

var el = document.getElementById("extractRequestBody");
el.addEventListener("click", extractRequestBody);

var el = document.getElementById("decodeJbeautify");
el.addEventListener("click", decodeJbeautify);






