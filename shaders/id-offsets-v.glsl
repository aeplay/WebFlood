attribute vec3 vertices;
attribute vec2 uvs;

varying vec2 uv;
varying vec2 uvLeft;
varying vec2 uvRight;
varying vec2 uvTop;
varying vec2 uvBottom;

uniform float unit;

void main(void) {
	uv = uvs;
	uvLeft = uv + vec2(-unit, 0.0);
	uvRight = uv + vec2(unit, 0.0);
	uvTop = uv + vec2(0.0, -unit);
    uvBottom = uv + vec2(0.0, unit);
	gl_Position = vec4(vertices.x, vertices.y, 1.0, 1.0);
}