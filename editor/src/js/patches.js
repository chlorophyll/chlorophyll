/*
 * Patches and fixes for other packages
 */
import keyboardJS from 'keyboardjs';

(function() {
    function stopCallback(element) {
        // Don't trigger keyboard events inside a text field
        if (element) {
            return element.tagName == 'INPUT'
                || element.tagName == 'TEXTAREA'
                || element.isContentEditable;
        } else {
            return false;
        }
    };

    const old_pressKey = keyboardJS.Keyboard.prototype.pressKey;
    keyboardJS.Keyboard.prototype.pressKey = function(keycode, event) {
        if (!stopCallback(event.target))
            old_pressKey.call(this, keycode, event);
    }

})();
