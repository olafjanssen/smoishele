/* global smoisheleAnalyser, smoisheleBlender */
// test range

var images = [];
for(var i=1; i<4; i++) {
	images.push('./images/jap/jap' + i + '.png');
}

smoisheleAnalyser.getFaceFeatures(images, function(detectedFaces){
	'use strict';
	console.log(detectedFaces);
	smoisheleBlender.blend(detectedFaces);
});