#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D water;
uniform float pixelWidth;
varying vec2 uv;

void main(void) {
    vec2 pos = gl_FragCoord.xy * 2.0 * pixelWidth;
    vec4 color1 = texture2D(water, pos + vec2(- pixelWidth / 4.0, - pixelWidth / 4.0));
    color1.z = max(0.0, color1.z);
    vec4 color2 = texture2D(water, pos + vec2(- pixelWidth / 4.0, + pixelWidth / 4.0));
    color2.z = max(0.0, color2.z);
    vec4 color3 = texture2D(water, pos + vec2(+ pixelWidth / 4.0, - pixelWidth / 4.0));
    color3.z = max(0.0, color3.z);
    vec4 color4 = texture2D(water, pos + vec2(+ pixelWidth / 4.0, + pixelWidth / 4.0));
    color4.z = max(0.0, color4.z);
    gl_FragColor = color1 + color2 + color3 + color4;
}