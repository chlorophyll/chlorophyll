#define DSP_STR 1.5
uniform sampler2D uSource;
uniform sampler2D uTarget;

uniform float amount;

varying vec2 vUv;

vec3 lerp(in vec3 a, in vec3 b, in float x) {
    return mix(a, b, smoothstep(0., 1., smoothstep(0., 1., x)));
}


void main() {
    vec3 source = texture2D(uSource, vUv).rgb;
    vec3 target = texture2D(uTarget, vUv).rgb;

    vec3 result = lerp(source, target, amount);

    gl_FragColor = vec4(clamp(result, 0., 1.), 1.0);
}
