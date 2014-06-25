/* global smoisheleAnalyser, smoisheleBlender */
// test range

var images = [];
for(var i=1; i<24; i++) {
	images.push('./images/jap/jap' + i + '.png');
}

smoisheleAnalyser.getFaceFeatures(images, function(detectedFaces){
	'use strict';
	smoisheleBlender.blend(detectedFaces, function(image) {
		window.open(image, '', '_blank');
	});
	
});