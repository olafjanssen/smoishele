/* global smoisheleDetect, smoisheleAnalyser, smoisheleBlender, smoisheleDataView */

/** 
 *	This object starts a blend based on file input.
 *	
 */
(function fileInput(smoisheleDetect, smoisheleAnalyser, smoisheleBlender, smoisheleDataView){
	'use strict';

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

		var count = 0,
			expectedCount = fileList.length;

		var start = 0,
			step  = 1;
		
		smoisheleDataView.reset();
		function processBatch(){
			var batch = fileList.slice(start, start + step);

			start += step;

			if (batch.length === 0) {
				smoisheleBlender.blend(smoisheleDataView.getFaces());
			}

			var expectedFaces = 0, analysedFaces = 0;

			batch.forEach(function(file) {
				console.log(file);
				var reader = new FileReader();
				reader.onerror = (function() {
					return function() {
						console.log('error!');
						processBatch();
					};
				})(file);

				reader.onload = (function() {
					return function(e) {
						count += 1;
						$('#progress-text').html(count + ' / ' + expectedCount);

						smoisheleDetect.getFaceFeatures(e.target.result,
							function(face) {
								if (face === null) {
									processBatch();
									return;
								}

								expectedFaces += 1;
								
								smoisheleAnalyser.getFaceFeatures(face, function(newFace){
									analysedFaces += 1;
									if (newFace){
										smoisheleDataView.addFace(newFace);
									}
								
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
})(smoisheleDetect, smoisheleAnalyser, smoisheleBlender, smoisheleDataView);
