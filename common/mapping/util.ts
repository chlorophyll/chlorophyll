import { Vector2, Vector3 } from 'three';
import * as T from '../types';

// TODO support constrained proportions (lock 2/3 coordinates scale together)
export function normalizePositions(points: Array<T.MappedPixel>, spec: Array<T.CoordSpec>): Array<T.MappedPixel> {
    const scaleFuncs = spec.map(({unit}, i) => {
        // Only normalize [0, 1] units (distance, numeric).
        if (unit.range[0] !== 0 || unit.range[1] !== 1)
            return null;

        // Find minimum/maximum values for each component
        const component = spec.length === 1 ? null : (['x', 'y', 'z'])[i];
        let [min, max] = points.reduce(
            ([min, max], {pos}) => {
                const dist = component ? pos[component] : pos;
                return [
                    Math.min(min, dist),
                    Math.max(max, dist)
                ];
            },
            [Infinity, -Infinity]
        );

        // Bail out if bounds are undefined
        if (min === -Infinity || max === Infinity)
            return null

        return (dist) => mapValue(dist, [min, max], [0, 1]);
    });

    // Apply scaling
    return points.map(({idx, pos}, i) => {
        if (spec.length === 1)
            return {idx, pos: scaleFuncs[0] ? scaleFuncs[0](pos) : pos};

        const vecPos = (<Vector2 | Vector3>pos);
        const scaled = vecPos.toArray().map((d, i) => {
            const scale = scaleFuncs[i];
            return scale ? scale(d) : d;
        });

        return {idx, pos: vecPos.fromArray(scaled)};
    });
};

function mapValue(value, [fromLow, fromHigh], [toLow, toHigh]) {
    return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}
