export default const TypeUtil = {
    convert_to_uint8_t: function(val) {
        return val & 0xff;
    },
    convert_to_int8_t: function(val) {
        return val & 0xff;
    },
    convert_to_uint16_t: function(val) {
        return val & 0xffff;
    },
    convert_to_int16_t: function(val) {
        return val & 0xffff;
    },
    convert_to_uint32_t: function(val) {
        return val & 0xffffffff;
    },
    convert_to_int32_t: function(val) {
        return val & 0xffffffff;
    }
}
