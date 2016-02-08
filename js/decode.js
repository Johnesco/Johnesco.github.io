'use strict';

// Variables
var $textBox = $('#textBox');


// Functions

// Beautifies JSON
function beautify() {
	var json_object = JSON.parse( $textBox.val() ) || '{"none":"none"}';
	$textBox.val( JSON.stringify( json_object, 1, '  ' ));
}

function viewJsonTree() {
	var jjson = $textBox.val() || '{"none":"none"}';
	$('#jjson').jJsonViewer(jjson);
}

// Beautififes and Displays JSON Tree
function beautifyTree() {
	beautify();
	viewJsonTree();
}

// Decodes a URL
function decode() {
	$textBox.val( decodeURIComponent( $textBox.val() ));
	beautifyTree();
}

// Parses the name-value pairs in a URL and formats them into JIRA markdown
function tablefy() {
	var uri = URI.parseQuery($textBox.val());
	var string = "";
	for (var key in uri) {
		if ( uri.hasOwnProperty( key )) {
			string+=( "|*" + key + ":* | " + uri[key] + " | \n" );
		}
	}
	$textBox.val( string.replace( 'http://b.rmntest.com/', '' ));
};

function extractPayload() {
	$textBox.val( $.parseJSON( $textBox.val() ).query.payload );
	beautifyTree();
}

function extractJ() {
	$textBox.val( $.parseJSON( $textBox.val() ).j );
	beautifyTree();
}

function extractRequestBody() {
	$textBox.val( $.parseJSON( $textBox.val() ).metadata.requestBody );
	decode();
	// beautifyTree();
}

function decodeJbeautify() {
	decode();
	extractJ();
	beautifyTree();
}


// jQuery Event Listener
// http://api.jquery.com/on/

$('#decode').on('click', decode);
$('#tablefy').on('click', tablefy);
$('#extractPayload').on('click', extractPayload)
$('#extractJ').on('click', extractJ);
$('#extractRequestBody').on('click', extractRequestBody);
$('#decodeJbeautify').on('click', decodeJbeautify);
$('#beautifyTree').on('click', beautifyTree);
