#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D texture;
varying vec2 uv;

void main(void) {
    gl_FragColor = texture2D(texture, uv);
}