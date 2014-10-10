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

    function handleFileSelect(evt) {
        var file = evt.target.files[0];

        if (file && file.type.match('application.json')) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var contents = e.target.result;
                faces = JSON.parse(contents);
            };
            reader.readAsText(file);
        }
    }

	document.getElementById('dbase-download').addEventListener('click', function(){
        var data = new Blob([JSON.stringify(faces)], {type: 'application/json'});
        document.getElementById('dbase-download').href = URL.createObjectURL(data);
	}, false);

    document.getElementById('dbase-upload').addEventListener('change', handleFileSelect, false);

	return {addFace: addFace, getFaces: getFaces, reset: reset};
})();

smoisheleFaceCache.reset();
