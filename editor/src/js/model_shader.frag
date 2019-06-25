#define CIRCLE_SIZE 0.225
#define OUTLINE_WIDTH 0.025
#define OUTLINE_SIZE (CIRCLE_SIZE + OUTLINE_WIDTH)

precision highp float;
varying vec2 vUv;

uniform bool displayOnly;
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
  float outline = circle(vec2(0.5)-uv, OUTLINE_SIZE);
  float circ = circle(vec2(0.5)-uv, CIRCLE_SIZE);

  if (!displayOnly && vColor == vec3(0.)) {
      discard;
  }
  if (outline < ALPHATEST)
    discard;
  gl_FragColor = vec4(mix(vec3(0.), vColor, circ), outline);
}
