Scenarios = {
	scenarios: {},

	fetch: function (url) {
		var req = new XMLHttpRequest();
		req.open("GET", url, false);
		req.send(null);
		Scenarios.scenarios = JSON.parse(req.responseText);
	},

	list: function () {
		var listElem = document.getElementById("scenarios");
		var template = _.template(
			'<a href="javascript:Scenarios.load(\'<%= name %>\', start)"><%= name %></a><br>'
		);
		Object.keys(Scenarios.scenarios).forEach(function (scenarioName) {
			listElem.innerHTML += template({name: scenarioName});
		});
	},

	load: function (scenarioName, callback) {
		var scenario = Scenarios.scenarios[scenarioName];

		[].forEach.call(document.getElementsByClassName("load"), function (elem){
			elem.style.display = "none";
		});
		[].forEach.call(document.getElementsByClassName("run"), function (elem){
			elem.style.display = "block";
		});
		document.getElementById("scenarioName").innerHTML = "<small>Loading:</small><br/>" + scenarioName;

		var nMapsToLoad = 0;

		["terrain", "water", "frictionMap"].forEach(function (map) {
			var mapUrl = scenario.simulation[map];
			if (mapUrl) {
				nMapsToLoad++;
				var xhr = new XMLHttpRequest();
				xhr.open('GET', mapUrl, true);
				xhr.responseType = "arraybuffer";
				xhr.onload = function(){mapLoaded(map, "simulation", tiffData(this.response));};
				xhr.send();
			}
		});

		var satUrl = scenario.visualisation.satellite;
		if (satUrl) {
			nMapsToLoad++;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', satUrl, true);
			xhr.responseType = "blob";
			xhr.onload = function () {
				var satImage = new Image();
				satImage.src = URL.createObjectURL(this.response);
				satImage.onload = function () {mapLoaded("satellite", "visualisation", satImage);}
			};
			xhr.send();
		}

		var mapLoaded = function (name, target, data) {
			scenario[target][name] = data;
			console.log(name, "loaded");
			if (--nMapsToLoad === 0) {
				console.log(scenario);
				Simulation.init(scenario.simulation);
				Visualisation.init(Simulation, scenario.visualisation);
				document.getElementById("scenarioName").innerHTML = scenarioName;
				callback();
			}
		}
	}
};