var center = new GLOW.Vector3(512, 512, -100);
var cameraDistance = 2400;
var cameraAzimuth = 7/4 * Math.PI;
var cameraAltitude = Math.PI / 3;

var camera;

var initCamera = function () {
	camera = new GLOW.Camera({
		useTarget: true,
		near: 10,
		far: 3000,
		fov: 30,
		aspect: context.width/context.height
	});
	camera.up = new GLOW.Vector3(0, 0, 1);
	camera.target = center;
	updateCamera();
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
	cameraAltitude = Math.max(0, Math.min(cameraAltitude, Math.PI / 2 - 0.05));
	updateCamera();
};

var moveCamera = function (deltaX, deltaY) {
	center.value[0] += Math.cos(cameraAzimuth) * deltaX + Math.sin(cameraAzimuth) * deltaY;
	center.value[1] += Math.sin(cameraAzimuth) * deltaX - Math.cos(cameraAzimuth) * deltaY;
	updateCamera();
};

var cursorToDisplayPosition = function (cursorX, cursorY) {
	var normalizedCursorPosition = new GLOW.Vector3(
		 2 * (cursorX - viewPortX) / viewPortWidth - 1,
		-2 * (cursorY - viewPortY) / viewPortHeight + 1,
		 1
	);

	var matrix = new GLOW.Matrix4();
	var inverseProjection = new GLOW.Matrix4();

	matrix.multiply(camera.globalMatrix, GLOW.Matrix4.makeInverse(camera.projection, inverseProjection));
	matrix.multiplyVector3(normalizedCursorPosition);

	var dir = new GLOW.Vector3();
	var cameraPos = camera.localMatrix.getPosition();

	dir.sub(normalizedCursorPosition, cameraPos);

	var rayLength = cameraPos.value[2] / dir.value[2];

	var pos = dir.clone();
	pos.multiplyScalar(-rayLength);
	pos.addSelf(cameraPos);
	pos.value[1] = Visualisation.displayScale - pos.value[1];
	return pos;
};
