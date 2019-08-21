import json
num_strips = 32
pixel_counts = [510]*num_strips  # for ragged, fill in list
min_x = 0
min_y = 0
max_x = max(pixel_counts)-1
max_y = len(pixel_counts)-1


def remap(v, f_l, f_h, t_l, t_h):
    return (v-f_l)*(t_h-t_l)/(f_h-f_l) + t_l


def remap_coords(x, y):
    xw = max_x / 2
    yw = max_y / 2
    rx = remap(x, min_x, max_x, -xw, xw)
    ry = remap(y, min_y, max_y, -yw, yw)
    return (rx, ry, 0)


def compute_strips():
    strips = []
    for y, pixel_count in enumerate(pixel_counts):
        s = [remap_coords(x, y) for x in range(pixel_count)]
        strips.append(s)
    return strips


out = {
    'strips': compute_strips(),
    'mapper': 'custom',
}

print(json.dumps(out))
