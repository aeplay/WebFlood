UI = {
	mode: "camera",

	init: function (setup) {
		Object.keys(setup.numbers).forEach(function (numberName) {
			var target = setup.numbers[numberName];
			var elem = document.getElementById(numberName);
			if (!elem) {console.warn("#" + numberName + " not found"); return;}
			target[numberName] = elem.valueAsNumber;
			elem.onchange = function () {target[numberName] = this.valueAsNumber;};
		});

		Object.keys(setup.toggles).forEach(function (toggleName) {
			var target = setup.toggles[toggleName];
			var elem = document.getElementById(toggleName);
			if (!elem) {console.warn("#" + toggleName + " not found"); return;}
			target[toggleName] = elem.checked;
			elem.onclick = function () {target[toggleName] = this.checked;};
		});

		Object.keys(setup.triggers).forEach(function (triggerName) {
			var callback = setup.triggers[triggerName];
			var elem = document.getElementById(triggerName);
			if (!elem) {console.warn("#" + triggerName + " not found"); return;}
			elem.onclick = callback;
		});

		viewportElem.onmousewheel = function (event) {
			zoomCamera( 10 * Math.sqrt(Math.abs(event.deltaY)) * (event.deltaY > 0 ? 1 : -1));
		};

		UI.rotatingCamera = false;
		UI.painting = false;

		viewportElem.onmousedown = function () {
			if (UI.mode === "camera") UI.rotatingCamera = true;
			if (UI.mode === "paintObstacles") UI.painting = true;
		};

		viewportElem.onmouseup = function () {
			UI.rotatingCamera = false;
			UI.painting = false;
			if (UI.mode === "addGauge")
				Visualisation.addGauge(
					Visualisation.displayToWorldPosition(
						cursorToDisplayPosition(UI.cursorX, UI.cursorY)));
		};

		viewportElem.onmousemove = function (event) {
			if (UI.rotatingCamera) rotateCamera(-event.movementX/200, event.movementY/200);
			UI.cursorX = event.clientX;
			UI.cursorY = event.clientY;
		};

		viewportElem.onkeydown = function (e) {
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
	},

	setNumbers: function (numbers) {
		_.pairs(numbers).forEach(function (pair) {
			var elem = document.getElementById(pair[0]);
			if (elem)
				elem.value = pair[1];
		})
	}
};