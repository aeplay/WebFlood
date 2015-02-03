uniform	mat4 transform;
uniform mat4 cameraInverse;
uniform mat4 cameraProjection;

attribute vec3 vertices;
attribute vec3 normals;
attribute vec2 uvs;

uniform float nTiles1d;
uniform float tileWidth;
uniform float x;
uniform float y;
uniform float unit;

uniform sampler2D texture;

varying vec2 uv;
varying float light;

void main(void) {
    uv = vec2(
        (uvs.x + x) / nTiles1d,
        (nTiles1d + -uvs.y - y )  / nTiles1d
    );
    //light = dot(normalize(mat3(transform[0].xyz, transform[1].xyz, transform[2].xyz) * normals), vec3(0.0, 0.0, 1.0));
    vec4 data = texture2D(texture, uv);

    float height = data.z + data.w;

    vec4 dataX1 = texture2D(texture, uv + vec2(unit * (-0.5), 0.0));
    vec4 dataX2 = texture2D(texture, uv + vec2(unit * 0.5, 0.0));
    vec4 dataY1 = texture2D(texture, uv + vec2(0.0, unit * (-0.5)));
    vec4 dataY2 = texture2D(texture, uv + vec2(0.0, unit * 0.5));

    vec2 dFloor = vec2(dataX2.w - dataX1.w, dataY2.w - dataY1.w) / unit;
    if (dFloor.x > 10.0 || dFloor.x < -10.0 || dFloor.y > 10.0 || dFloor.y < -10.0) {
        height = 0.0;
    }

    gl_Position = cameraProjection * cameraInverse * transform * vec4(
        vertices.x + tileWidth * x,
        vertices.y + tileWidth * y,
        vertices.z + height * 1000.0 + 0.3,
        1.0
    );
}