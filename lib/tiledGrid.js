var gridVertices = function (subdivisions, size) {
	var vertices = new Float32Array(3 * (subdivisions + 1) * (subdivisions + 1));
	var i = 0;

	for (var y = 0; y <= subdivisions; y++) {
		for (var x = 0; x <= subdivisions; x++) {
			vertices[i * 3 + 0] = x * size / subdivisions;
			vertices[i * 3 + 1] = y * size / subdivisions;
			vertices[i * 3 + 2] = 0;
			i++;
		}
	}

	return vertices;
};

var gridUvs = function (subdivisions) {
	var uvs =  new Float32Array(2 * (subdivisions + 1) * (subdivisions + 1));
	var i = 0;

	for (var y = 0; y <= subdivisions; y++) {
		for (var x = 0; x <= subdivisions; x++) {
			uvs[i * 2 + 0] = x / subdivisions;
			uvs[i * 2 + 1] = y / subdivisions;
			i++;
		}
	}

	return uvs;
};

var gridIndices = function (subdivisions) {
	var numPrimitives = 2 * subdivisions * subdivisions;
	var indices = new Float32Array(3 * numPrimitives);
	var i = 0;

	for (var y = 0; y < subdivisions; y++) {
		for (var x = 0; x < subdivisions; x++) {
			// 0___1
			//  | /
			//  |/
			//  2
			indices[i * 3 + 0] = y * (subdivisions + 1) + x;
			indices[i * 3 + 1] = y * (subdivisions + 1) + x + 1;
			indices[i * 3 + 2] = (y + 1) * (subdivisions + 1) + x;
			i++;
			//    0
			//   /|
			//  /_|
			// 2  1
			indices[i * 3 + 0] = y * (subdivisions + 1) + x + 1;
			indices[i * 3 + 1] = (y + 1) * (subdivisions + 1) + x + 1;
			indices[i * 3 + 2] = (y + 1) * (subdivisions + 1) + x;
			i++;
		}
	}

	return indices;
};

var createMeshTiles = function (parameters) {
	var maxTileSize = parameters.maxTileSize;
	var vertexShader = parameters.vertexShader;
	var fragmentShader = parameters.fragmentShader;
	var nTiles1d = gridResolution / maxTileSize;
	var tiles = [];
	var vertices = gridVertices(gridResolution / nTiles1d, gridSize / nTiles1d);
	var uvs = gridUvs(gridResolution / nTiles1d);
	var indices = gridIndices(gridResolution / nTiles1d);
	var normals = GLOW.Geometry.faceNormals(vertices, indices);

	for (var y = 0; y < nTiles1d; y++) {
		for (var x = 0; x < nTiles1d; x++) {
			tiles.push(new GLOW.Shader({
				vertexShader: loadSynchronous("shaders/" + vertexShader + ".glsl"),
				fragmentShader: loadSynchronous("shaders/" + fragmentShader + ".glsl"),

				data: _.extend(parameters.data, {
					vertices: vertices,
					uvs: uvs,
					nTiles1d: new GLOW.Float(nTiles1d),
					tileWidth: new GLOW.Float(gridSize / nTiles1d),
					x: new GLOW.Float(x),
					y: new GLOW.Float(y),
					normals: normals
				}),

				interleave: {
					vertices: false,
					uvs: false
				},

				indices: indices
			}));
		}
	}

	return tiles;
};