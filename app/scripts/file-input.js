/* global smoisheleDetect, smoisheleAnalyser, smoisheleBlender, smoisheleDataView, smoisheleSharing, analyse */

/** 
 *	This object starts a blend based on file input.
 *	
 */
(function fileInput(smoisheleDetect, smoisheleAnalyser, smoisheleBlender, smoisheleDataView, smoisheleSharing){
	'use strict';

    var canceled = false;
    document.getElementById('smoishel-button').addEventListener('click', function(){
        canceled = true;
    }, false);

	function handleFileSelect(evt) {
		canceled = false;

		$('body').addClass('analysing');
		var length = document.querySelector('.progress-circle path').getTotalLength();
		$('.progress-circle path').css('stroke-dasharray',length + ' ' + length)
		.css('stroke-dashoffset', length);

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

			if (batch.length === 0 || canceled) {
				smoisheleBlender.blend(smoisheleDataView.getFaces(), function(image){
					smoisheleSharing.setResult({url: image, message: 'I smoisheled some photo\'s on smoishele.com!'});
				});
				return;
			}

			batch.forEach(function(file) {
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
						var length = document.querySelector('.progress-circle path').getTotalLength();
						$('.progress-circle path').css('stroke-dasharray',length + ' ' + length)
						.css('stroke-dashoffset', length * (1-count/expectedCount));

						analyse(e.target.result, processBatch);
					};
				})(file);
				reader.readAsDataURL(file);
			});
		}

		// process first batch
		processBatch();
	}

	document.getElementById('file-upload-button').addEventListener('change', handleFileSelect, false);
})(smoisheleDetect, smoisheleAnalyser, smoisheleBlender, smoisheleDataView, smoisheleSharing);
