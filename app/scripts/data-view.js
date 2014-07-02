/** 
 *	This object collects analysed faces to be blended.
 *	
 */
var smoisheleDataView = (function($) {
	'use strict';

	var faces = [];

	function addFace(face) {
		faces.push(face);

		var $img = $('<div class="input-thumb"></div>');
		$img.css('background-image', 'url(' + face.image.url + ')');
		$('#analysed-folder').append($img);
		var scrollContainer = document.getElementById('analysed-folder');
		scrollContainer.scrollTop = scrollContainer.scrollHeight;
	}

	function getFaces() {
		return faces;
	}

	function reset() {
		faces = [];
	}

	return {addFace: addFace, getFaces: getFaces, reset: reset};
})($);

smoisheleDataView.reset();