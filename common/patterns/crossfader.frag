uniform sampler2D uSource;
uniform sampler2D uTarget;

uniform float time;

varying vec2 vUv;
#pragma glslify: ease = require('glsl-easings/quartic-in')

vec3 rgb_to_hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}


vec3 hue_to_rgb(float hue) {
    float r = abs(hue * 6. - 3.) - 1.;
    float g = 2. - abs(hue * 6. - 2.);
    float b = 2. - abs(hue * 6. - 4.);
    return clamp(vec3(r,g,b), 0., 1.);
}

vec3 hsv_to_rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 lerp_hsv(vec3 c1, vec3 c2, float t) {
    float hue = (mod(mod((c2.x-c1.x), 1.) + 1.5, 1.)-0.5)*t + c1.x;
    return vec3(hue, mix(c1.yz, c2.yz, t));
}

vec3 lerp(vec3 source, vec3 target, float t) {
    vec3 rgb_blend = mix(source, target, t);
    vec3 hsv_target = rgb_to_hsv(target);
    vec3 hsv_blend = rgb_to_hsv(rgb_blend);
    vec3 mixed = lerp_hsv(hsv_blend, hsv_target, t);
    return hsv_to_rgb(mixed);
}

void main() {
    vec3 source = texture2D(uSource, vUv).rgb;
    vec3 target = texture2D(uTarget, vUv).rgb;

    vec3 result = lerp(source, target, ease(time));

    gl_FragColor = vec4(clamp(result, 0., 1.), 1.0);
}
