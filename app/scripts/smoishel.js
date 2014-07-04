/* global smoisheleDetect, smoisheleAnalyser, smoisheleDataView, smoisheleFaceCache */

/**
 * Function that computes the hash of a string; following:
 * http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
 */
function getHashCode(data) {
	'use strict';
	var hash = 0, i, chr, len;
	if (data.length === 0) {
		return hash;
	}
	/*jslint bitwise: true */
	for (i = 0, len = data.length; i < len; i++) {
		chr   = data.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
	    hash |= 0; // Convert to 32bit integer
	}
	/*jslint bitwise: false */
	return hash;
}


function analyse(url, callback, options){
	'use strict';

	var hash = getHashCode(url),
		cachedFaces = smoisheleFaceCache.getFaces(hash);
	
	if (cachedFaces === undefined) {
		var expectedFaces = 0, analysedFaces = 0;

		smoisheleDetect.getFaceFeatures(url,
			function(face) {
				if (face === null) {
					callback();
					return;
				}

				expectedFaces += 1;
				
				smoisheleAnalyser.getFaceFeatures(face, function(newFace){
					analysedFaces += 1;
					if (newFace){
						newFace.hash = hash;
						smoisheleDataView.addFace(newFace);
						smoisheleFaceCache.addFace(newFace);
					}
				
					if (analysedFaces === expectedFaces){
						callback();
					}
				});
			}, options);
	} else {
		cachedFaces.forEach(function(face){
			smoisheleDataView.addFace(face);
		});
		callback();
	}
}

console.log(analyse);