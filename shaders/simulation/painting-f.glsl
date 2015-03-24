#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D texture;
uniform vec2 center;
uniform float height;
varying vec2 uv;

float radius = 0.005;

void main(void) {
    //float dt = 1.0 / 60.0;
    vec2 pos = uv;
    vec4 data = texture2D(texture, pos);

    if (distance(pos, center) > radius)
        gl_FragColor = data;
    else
        gl_FragColor = vec4(data.xy, -0.001, mix(height, data.w, distance(pos, center)/radius));
}