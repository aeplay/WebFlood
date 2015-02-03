function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var assureRequiredGLFeatures = function (context) {
	if( !context.enableExtension( "OES_texture_float" )) {
		alert( "No support for float textures!" );
		//return;
	}

	if( !context.enableExtension( "OES_texture_float_linear" )) {
		alert( "No support for float texture linear interpolation!" );
		//return;
	}

	if( !context.enableExtension( "OES_standard_derivatives" )) {
		alert( "No support for standard derivatives!" );
		//return;
	}

	if( !context.maxVertexTextureImageUnits()) {
		alert( "No support for vertex shader textures!" );
		//return;
	}
};

var loadSynchronous = function(url) {
	var req = new XMLHttpRequest();
	req.open("GET", url, false);
	req.send(null);
	return (req.status == 200) ? req.responseText : null;
};