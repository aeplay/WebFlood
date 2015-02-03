UI = {
	init: function (setup) {
		Object.keys(setup.numbers).forEach(function (numberName) {
			var target = setup.numbers[numberName];
			var elem = document.getElementById(numberName);
			target[numberName] = elem.valueAsNumber;
			elem.onchange = function () {target[numberName] = this.valueAsNumber;};
		});

		Object.keys(setup.toggles).forEach(function (toggleName) {
			var target = setup.toggles[toggleName];
			var elem = document.getElementById(toggleName);
			target[toggleName] = elem.checked;
			elem.onclick = function () {target[toggleName] = this.checked;};
		});

		Object.keys(setup.triggers).forEach(function (triggerName) {
			var callback = setup.triggers[triggerName];
			document.getElementById(triggerName).onclick = callback;
		});
	}
};