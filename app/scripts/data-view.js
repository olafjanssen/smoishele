/** 
 *	This object collects analysed faces to be blended.
 *	
 */
var smoisheleDataView = (function($) {
	'use strict';

	var faces = [];

	function addFace(face) {
		$('body').addClass('analysing');
		faces.push(face);

		var $img = $('<div class="input-thumb"></div>');
		$img.css('background-image', 'url(' + face.image.url + ')');
		$('#analysed-folder').append($img);

		setTimeout(function(){
			$img.css('left', (Math.random()*100) +'%');
			$img.css('top', (Math.random()*100) + '%');
		}, 0);
	
		var scrollContainer = document.getElementById('analysed-folder');
		scrollContainer.scrollTop = scrollContainer.scrollHeight;
	}

	function getFaces() {
		return faces;
	}

	function reset() {
		faces = [];
		$('.input-thumb').remove();
	}

	return {addFace: addFace, getFaces: getFaces, reset: reset};
})($);

smoisheleDataView.reset();