void main(void) {
    //float dt = 1.0 / 60.0;
    vec2 pos = gl_FragCoord.xy * unit;

    vec4 data = texture2D(texture, pos);

    gl_FragColor = vec4(data.x, data.y, data.z + 0.1 * dt, data.w);
}