
#ifdef GL_ES
	precision highp float;
#endif

uniform sampler2D texture;
uniform sampler2D noise;
uniform float time;
varying float light;
varying vec2 uv;

void main(void) {
	float scaling = 1.0;
	float walkDistance = 0.03;
	float colorMultiplier = 30.0;
	vec2 pos = uv;
	vec4 data = texture2D(texture, pos);
	vec2 v = data.xy;

//	if (length(v) > 0.002
//	&& 0.1 * length(v) / pow(max(0.0, data.z), 2.0) >= 0.2
//	&& mod(texture2D(noise, pos.yx * 2.0 * (-scaling)).x + 5.0 * time, 1.0) > 0.3) {
//		float b = 3.0;
//		gl_FragColor = vec4(b, b, b, 1.0);
//		return;
//	}

	float b = 0.0;
	float n = 0.0;
	float maxN = 30000.0 * length(v);

	for (int i = 0; i < 40; i++) {
		float phaseShift = texture2D(noise, pos.yx * (-scaling)).x;
		b += mod(texture2D(noise, pos * scaling).x + phaseShift - 0.18 * time, 0.21)  * length(v) * colorMultiplier;
        pos += v * walkDistance;
        v = texture2D(texture, pos).xy;
		n += 1.0;
		if (i > 4 && n > maxN) break;
	}

	b = b / n;

	gl_FragColor = vec4(b, b, b, 1.0);

	//gl_FragColor = vec4(min(1.0, length(v) / (0.8 * 250.0/256.0)), 0.0, data.z * 5.0, 1.0);
}