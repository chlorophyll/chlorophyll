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

    function wrapHandler(handler) {
        if (handler) {
            return function(event) {
                if (!stopCallback(event.target))
                    handler(event);
            };
        } else {
            return null;
        }
    }

    let oldBind = keyboardJS.Keyboard.prototype.bind;
    keyboardJS.Keyboard.prototype.bind = function(keyComboStr, pressHandler,
            releaseHandler, preventRepeatByDefault) {
        // Wrap press/release functions to prevent them from executing if a
        // text input is selected.
        oldBind.call(this, keyComboStr,
                wrapHandler(pressHandler),
                wrapHandler(releaseHandler),
                preventRepeatByDefault);
    };

})();
