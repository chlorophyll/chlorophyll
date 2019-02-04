attribute vec2 aOffset;
uniform sampler2D computedColors;
varying vec3 vComputedColor;

attribute vec3 overlayColor;
varying vec3 vOverlayColor;

uniform float pointSize;

void main() {
    vOverlayColor = overlayColor;
    vComputedColor = texture2D(computedColors, aOffset).rgb;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = pointSize * ( 350. / - mvPosition.z );
}
