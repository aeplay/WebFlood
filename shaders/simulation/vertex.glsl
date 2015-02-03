attribute vec3 vertices;
attribute vec2 uvs;

varying vec2 pos;
varying vec2 posLeft;
varying vec2 posRight;
varying vec2 posTop;
varying vec2 posBottom;

uniform float unit;

void main(void) {
	pos = uvs;
	posLeft = pos + vec2(-unit, 0.0);
	posRight = pos + vec2(unit, 0.0);
	posTop = pos + vec2(0.0, -unit);
    posBottom = pos + vec2(0.0, unit);
	gl_Position = vec4(vertices.x, vertices.y, 1.0, 1.0);
}