#define CIRCLE_SIZE 0.225

precision highp float;
varying vec2 vUv;

uniform bool displayOnly;
uniform float outlineWidth;
varying vec3 vColor;

float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold-afwidth, threshold+afwidth, value);
}

float circle(vec2 p, float radius) {
  return 1.-aastep(radius, length(p)-radius);
}

vec3 toLinear(vec3 v, float gamma) {
    return pow(v, vec3(gamma));
}


void main() {
  vec3 outcolor;
  vec2 uv =  vUv;
  float outlineSize = CIRCLE_SIZE + outlineWidth;
  float outline = circle(vec2(0.5)-uv, outlineSize);
  float circ = circle(vec2(0.5)-uv, CIRCLE_SIZE);

  if (!displayOnly && vColor == vec3(0.)) {
      discard;
  }
  if (outline < ALPHATEST)
    discard;
  if (outlineWidth > 0.) {
      outcolor = mix(vec3(0.), vColor, circ);
  } else {
      outcolor = vColor;
  }
  gl_FragColor = vec4(outcolor, outline);
}
