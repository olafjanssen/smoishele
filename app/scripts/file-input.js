/* global smoisheleDetect, smoisheleAnalyser, smoisheleBlender */

/** 
 *	This object starts a blend based on file input.
 *	
 */
(function fileInput(smoisheleDetect, smoisheleAnalyser, smoisheleBlender){
	'use strict';

	// function startBlend() {
	// 	$('#analysed-folder').empty();

	// 	// smoisheleAnalyser.getFaceFeatures(images, function(face){
	// 	// 	var $img = $('<div class="input-thumb"></div>');
	// 	// 	$img.css('background-image', 'url(' + face.image.url + ')');
	// 	// 	$('#analysed-folder').append($img);

	// 	// 	var scrollContainer = document.getElementById('analysed-folder');
	// 	// 	scrollContainer.scrollTop = scrollContainer.scrollHeight;
	// 	// }, function(detectedFaces){
	// 	// 	smoisheleBlender.blend(detectedFaces, function(image) {
	// 	// 		window.open(image, '', '_blank');
	// 	// 	});
	// 	// });
	// }

	function handleFileSelect(evt) {
		// filter the input for image files
		var files = evt.target.files;
		var fileList = [];
		for (var i = 0;i < files.length;i++) {
			if (!files[i].type.match('image.*')) {
				continue;
			}
			fileList.push(files[i]);
		}

		// load all files into file urls
		document.documentElement.classList.add('analysing');

		var faces = [];

		var start = 0,
			step  = 1;
		
		function processBatch(){
			var batch = fileList.slice(start, start + step);

			console.log('batch:');
			console.log(batch);

			start += step;

			if (batch.length === 0) {
				smoisheleBlender.blend(faces);
			}

			var expectedFaces = 0, analysedFaces = 0;

			batch.forEach(function(file) {
				var reader = new FileReader();
				reader.onload = (function() {
					return function(e) {
						smoisheleDetect.getFaceFeatures(e.target.result,
							function(face) {
								if (!face) {
									processBatch();
								}

								var $img = $('<div class="input-thumb"></div>');
								$img.css('background-image', 'url(' + face.image.url + ')');
								$('#analysed-folder').append($img);
								var scrollContainer = document.getElementById('analysed-folder');
								scrollContainer.scrollTop = scrollContainer.scrollHeight;

								expectedFaces += 1;
								console.log(face);

								smoisheleAnalyser.getFaceFeatures(face, function(newFace){
									analysedFaces += 1;
									if (newFace){
										faces.push(newFace);
									}
									console.log(newFace);

									if (analysedFaces === expectedFaces){
										processBatch();
									}
								});

							});
					};
				})(file);
				reader.readAsDataURL(file);
			});
		}

		// process first batch
		processBatch();
	}

	document.getElementById('file-upload-button').addEventListener('change', handleFileSelect, false);
})(smoisheleDetect, smoisheleAnalyser, smoisheleBlender);
