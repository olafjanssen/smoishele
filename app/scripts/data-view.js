/** 
 *	This object collects analysed faces to be blended.
 *	
 */
var smoisheleDataView = (function($) {
	'use strict';

	var faces = [];

	function addFace(face) {
		console.log(face);

		faces.push(face);

		var $img = $('<div class="input-thumb" id="inp-' + faces.length + '"></div>');
		$img.css('background-image', 'url(' + face.image.url + ')');
		$('#input-box').append($img);
		$('#inp-' + (faces.length - 50) ).remove();

		setTimeout(function(){
			$img.css('left', (face.quality*100) +'%');
			$img.css('top', (Math.random()*100) + '%');
		}, 0);
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