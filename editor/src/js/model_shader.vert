attribute float aOffset;
varying float vOffset;

attribute vec3 overlayColor;
varying vec3 vOverlayColor;

uniform float pointSize;

void main() {
    vOffset = aOffset;
    vOverlayColor = overlayColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = pointSize * ( 350. / - mvPosition.z );
}
