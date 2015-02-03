var center = new GLOW.Vector3(512, 512, -100);
var cameraDistance = 2000;
var cameraAzimuth = 0.25 * Math.PI;
var cameraAltitude = 0.25 * Math.PI;

var camera = new GLOW.Camera({
	useTarget: true,
	near: 10,
	far: 3000
});

var initCamera = function () {
	camera.up = new GLOW.Vector3(0, 0, 1);
	camera.target = center;
	updateCamera();
	registerControls();
};

var updateCamera = function () {
	camera.localMatrix.setPosition(
		center.value[0] + cameraDistance * Math.cos(cameraAltitude) * Math.cos(cameraAzimuth),
		center.value[1] + cameraDistance * Math.cos(cameraAltitude) * Math.sin(cameraAzimuth),
		center.value[2] + cameraDistance * Math.sin(cameraAltitude)
	);
	camera.update();
};

var zoomCamera = function (delta) {
	cameraDistance += delta;
	if (cameraDistance < 10) cameraDistance = 10;
	updateCamera();
};

var rotateCamera = function (deltaX, deltaY) {
	cameraAzimuth += deltaX;
	cameraAltitude += deltaY;
	cameraAltitude = Math.min(cameraAltitude, Math.PI / 2 - 0.05);
	updateCamera();
};

var moveCamera = function (deltaX, deltaY) {
	center.value[0] += Math.cos(cameraAzimuth) * deltaX + Math.sin(cameraAzimuth) * deltaY;
	center.value[1] += Math.sin(cameraAzimuth) * deltaX - Math.cos(cameraAzimuth) * deltaY;
	console.log(center.value);
	updateCamera();
};

registerControls = function () {
	document.onmousewheel = function (event) {
		zoomCamera( 10 * Math.sqrt(Math.abs(event.deltaY)) * (event.deltaY > 0 ? 1 : -1));
	};

	var rotating = false;

	document.onmousedown = function () {
		rotating = true;
	};

	document.onmouseup = function () {
		rotating = false;
	};

	document.onmousemove = function (event) {
		if (rotating) {
			rotateCamera(-event.movementX/200, event.movementY/200);
		}
	};

	document.onkeydown = function (e) {
		if (e.keyCode == '38') {
			moveCamera(-10, 0);
		}
		else if (e.keyCode == '40') {
			moveCamera(10, 0);
		}
		else if (e.keyCode == '37') {
			moveCamera(0, 10);
		}
		else if (e.keyCode == '39') {
			moveCamera(0, -10);
		}

	};
};

