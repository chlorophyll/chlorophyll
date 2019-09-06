precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec2 uv;

attribute vec2 aOffset;
attribute vec3 aTranslate;
attribute float aPointSize;
uniform sampler2D computedColors;

attribute vec3 aOverlayColor;
varying vec3 vColor;

uniform float pointSize;
uniform float scale;
uniform bool displayOnly;

varying vec2 vUv;

vec3 toGamma(vec3 v, float gamma) {
    return pow(v, vec3(1.0 / gamma));
}

void main() {
    vUv = uv;

    if (!displayOnly) {
        vColor = aOverlayColor;
    } else {
        vec3 color = texture2D(computedColors, aOffset).rgb;
        color = toGamma(color, 2.5);
        color.b *= 1.05;
        vColor = color;
    }

    vec4 mvPosition = modelViewMatrix * vec4(aTranslate, 1.);
    mvPosition.xyz += position * max(aPointSize, pointSize);
    gl_Position = projectionMatrix * mvPosition;
}
