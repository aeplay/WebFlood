var Simulation = {
	parameters: {},
	init: function (settings) {
		settings = _.defaults(settings, {
			terrain: null,
			resolution: 256,
			worldSize: 1,
			heightScale: 1,
			dt: 0.01,
			initialStepCount: 0,
			gravity: 9.81,
			manningCoefficient: 0.013,
			sourceWaterHeight: 0,
			sourceWaterVelocity: 0
		});

		_.pairs(settings).forEach(function (pair) {console.log(pair[0], pair[1])});
		this.settings = settings;
		UI.setNumbers(settings);

		// layout: (x, y = velocity, z = water height, w = terrain height)
		var initialConditions = new Float32Array(settings.resolution * settings.resolution * 4);

		if (settings.water) for (var p = 0; p < settings.terrain.length; p++)
			initialConditions[p * 4 + 2] = (settings.water[p] - 0.5) * 2 / (settings.worldSize);
		else for (p = 0; p < settings.terrain.length; p++)
			initialConditions[p * 4 + 2] = -0.0001;//0.04 - data.terrain[p] / (settings.worldSize);

		for (p = 0; p < settings.terrain.length; p++)
			initialConditions[p * 4 + 3] = settings.heightScale * settings.terrain[p] / (settings.worldSize)

		var frictionMap = new Float32Array(settings.resolution * settings.resolution * 4);
		if (settings.frictionMap)
			for (p = 0; p < frictionMap.length; p++) frictionMap[p * 4] = settings.frictionMap[p];
		else for (p = 0; p < frictionMap.length; p++) frictionMap[p * 4] = 1.0;

			Simulation.state = new FlipFlopFBO({
			width: settings.resolution,
			height: settings.resolution,
			type: GL.FLOAT,
			magFilter: GL.LINEAR,
			minFilter: GL.LINEAR,
			depth: false,
			data: initialConditions
		});

		var defineSimulationStep = function (fragmentShader, uniforms) {
			console.log(fragmentShader);
			return new GLOW.Shader({
				vertexShader: loadSynchronous("shaders/simulation/vertex.glsl"),
				fragmentShader: loadSynchronous("shaders/simulation/prefix.glsl") + "\n" +
					loadSynchronous("shaders/simulation/steps/" + fragmentShader + ".glsl"),
				data: _.extend(uniforms, {
					texture: undefined,
					vertices: GLOW.Geometry.Plane.vertices(),
					uvs: GLOW.Geometry.Plane.uvs(),
					unit: new GLOW.Float(1/settings.resolution),
					dt: new GLOW.Float(settings.dt),
					sourceWaterHeight: new GLOW.Float(0),
					sourceWaterVelocity: new GLOW.Float(0)
				}),
				indices: GLOW.Geometry.Plane.indices()
			});
		};

		var advectionStep = defineSimulationStep('advect-height-velocity', {});

		var heightIntegrationStep = defineSimulationStep('update-height', {
			drainageAmount: new GLOW.Float(0)
		});

		var frictionTexture = new GLOW.Texture({
			data: frictionMap,
			width: settings.resolution,
			height: settings.resolution,
			type: GL.FLOAT
		});

		var velocityIntegrationStep = defineSimulationStep('update-velocity', {
			frictionMap: frictionTexture,
			manningCoefficient: new GLOW.Float(0),
			gravity: new GLOW.Float(0)
		});

		Simulation.steps = [
			advectionStep,
			heightIntegrationStep,
			velocityIntegrationStep
		];

		Simulation.damage = new FlipFlopFBO({
			width: settings.resolution,
			height: settings.resolution,
			type: GL.FLOAT,
			magFilter: GL.NEAREST,
			minFilter: GL.NEAREST,
			depth: false
		});

		var damageStep = new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/id-v.glsl"),
			fragmentShader: loadSynchronous("shaders/simulation/damage-f.glsl"),
			data: {
				texture: undefined,
				damage: undefined,
				dt: new GLOW.Float(settings.dt),
				inputPixelWidth: new GLOW.Float(1/2),
				vertices: GLOW.Geometry.Plane.vertices(),
				uvs: GLOW.Geometry.Plane.uvs()
			},
			indices: GLOW.Geometry.Plane.indices()
		});

		var paintingStep = new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/id-v.glsl"),
			fragmentShader: loadSynchronous("shaders/simulation/painting-f.glsl"),
			data: {
				texture: undefined,
				center: new GLOW.Vector2(0, 0),
				height: new GLOW.Float(0.01),
				vertices: GLOW.Geometry.Plane.vertices(),
				uvs: GLOW.Geometry.Plane.uvs()
			},
			indices: GLOW.Geometry.Plane.indices()
		});

		Simulation.parameters = {
			stepsPerFrame: 0,
			set sourceWaterHeight (height) {
				Simulation.steps.forEach(function (step) {
					step.uniforms.sourceWaterHeight.data = new GLOW.Float(height / settings.worldSize);
				});
			},
			set sourceWaterVelocity (velocity) {
				Simulation.steps.forEach(function (step) {
					step.uniforms.sourceWaterVelocity.data = new GLOW.Float(velocity / settings.worldSize);
				});
			},
			set manningCoefficient (n) {
				var correctedN = n * Math.pow(settings.worldSize, 1/3);
				velocityIntegrationStep.uniforms.manningCoefficient.data = new GLOW.Float(correctedN);
			},
			set gravity (g) {
				var correctedG = g/settings.worldSize;
				velocityIntegrationStep.uniforms.gravity.data = new GLOW.Float(correctedG);
			},
			set drainageAmount (drainageAmount) {
				heightIntegrationStep.uniforms.drainageAmount.data = new GLOW.Float(drainageAmount);
			}
		};

		Simulation.t = 0;
		Simulation.nStepsTotal = settings.initialStepCount;

		Simulation.update = function () {
			context.enableDepthTest(false);

			if (UI.painting) {
				paintingStep.uniforms.center.data = (new GLOW.Vector2).copy(
					Visualisation.displayToSimulationPosition(
					cursorToDisplayPosition(UI.cursorX, UI.cursorY)));
				paintingStep.uniforms.texture.data = Simulation.state.texture;
				Simulation.state.target.bind();
				paintingStep.draw();
				Simulation.state.target.unbind();
				Simulation.state.flip();
			}

			for (var i = 0; i < Simulation.parameters.stepsPerFrame; i++) {
				Simulation.t += settings.dt;

				Simulation.steps.forEach(function (step) {
					Simulation.state.target.bind();
					step.uniforms.texture.data = Simulation.state.texture;
					step.draw();
					Simulation.state.target.unbind();
					Simulation.state.flip();
				});

				Simulation.nStepsTotal++;

				Simulation.damage.target.bind();
				damageStep.uniforms.texture.data = Simulation.state.texture;
				damageStep.uniforms.damage.data = Simulation.damage.texture;
				damageStep.draw();
				Simulation.damage.target.unbind();
				Simulation.damage.flip();
			}
		};
	}
};