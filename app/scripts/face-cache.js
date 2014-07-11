/** 
 *	This object manages a cache of analysed faces.
 *	
 */
var smoisheleFaceCache = (function() {
	'use strict';
	
	var faces = {};

	function addFace(face) {
		var hash = face.hash;

		if (faces[hash] === undefined) {
			faces[hash] = [ face ];
		} else {
			faces[hash].push(face);
		}
	}

	function getFaces(hash) {
		return faces[hash];
	}

	function reset() {
		faces = {};
	}

	document.getElementById('dbase-download').addEventListener('click', function(){
		var newWindow = window.open('', '_blank');
		newWindow.document.write(JSON.stringify(faces));
	}, false);

	return {addFace: addFace, getFaces: getFaces, reset: reset};
})();

smoisheleFaceCache.reset();
