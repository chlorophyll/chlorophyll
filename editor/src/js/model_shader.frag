#define CIRCLE_SIZE 0.25
#define OUTLINE_WIDTH 0.015
#define OUTLINE_SIZE (CIRCLE_SIZE - OUTLINE_WIDTH)
uniform sampler2D computedColors;
varying float vOffset;

uniform bool displayOnly;
varying vec3 vOverlayColor;

float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold-afwidth, threshold+afwidth, value);
}

float circle(vec2 p, float radius) {
  return 1.-aastep(radius, length(p)-radius);
}

void main() {
  vec3 outcolor;
  vec2 uv =  vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ).xy;
  float outline = circle(vec2(0.5)-uv, CIRCLE_SIZE);
  float circ = circle(vec2(0.5)-uv, OUTLINE_SIZE);
  vec3 outlineColor = vec3(0.);
  if (!displayOnly) {
    if (vOverlayColor == vec3(0.)) {
      discard;
    }
    outcolor = vOverlayColor;
  } else {
    outcolor = texture2D(computedColors, vec2(vOffset, 0.5)).rgb;
  }
  outcolor = mix(vec3(outlineColor), outcolor, circ);
  if (outline == 0.)
    discard;
  gl_FragColor = vec4(outcolor, outline);
}
