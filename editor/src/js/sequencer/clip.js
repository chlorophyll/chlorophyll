export default function Clip(id) {
    this.id = id;
    this.name = `clip-${id}`;
    /*
     * list of { mapping, pattern } describing a pattern to apply for each
     * mapping in the clip.
     */
    this.assigned_patterns = [];

    /*
     * Preview an clip, executing & displaying all component patterns.
     */
    this.runPreview = function() {
    };

    /*
     * Stop running the current clip, if one exists.
     */
    this.stopPreview = function() {
    };

    /*
     * Determine whether the pattern->mapping assignment is valid.
     * In a valid assignment:
     *
     * 1. There are no unpaired patterns or mappings (null->null is ignored).
     * 2. Mappings are mutually exclusive.
     * 3. Each pattern's input type is supported by its mapping.
     *
     * Returns true if valid and false otherwise.
     */
    this.validate = function() {
    };
}
