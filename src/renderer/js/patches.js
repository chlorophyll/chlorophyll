/*
 * Patches and fixes for other packages
 */
import keyboardJS from 'keyboardjs';

Inspector.prototype.addComboButtons = function(name, value, options) {
    options = this.processOptions(options);

    value = value || '';
    let that = this;
    this.values[name] = value;

    let code = '';
    if (options.values)
        for (let v of options.values)
            code += '<button class=\'wcombobutton ' +
                (value == v ? 'selected':'') + '\' data-name=\'' + v + '\'>' +
                v + '</button>';

    let element = this.createWidget(name, code, options);
    let buttons = element.querySelectorAll( '.wcontent button' );
    LiteGUI.bind( buttons, 'click', function(e) {

        let buttonname = e.target.innerHTML;
        that.values[name] = buttonname;

        let elements = element.querySelectorAll('.selected');
        for (let el of elements)
            el.classList.remove('selected');
        this.classList.add('selected');

        Inspector.onWidgetChange.call( that, element, name, buttonname, options );
    });

    element.setValue = function(val) {
        let selected;
        for (let el of buttons) {
            if (el.getAttribute('data-name') == val)
                selected = el;
            el.classList.remove('selected');
        }

        if (selected)
            selected.classList.add('selected');

        that.values[name] = val;
    };

    this.append(element, options);
    this.processElement(element, options);
    return element;
};

LiteGUI.Tree.prototype.expandItem = function(id) {
    let item = this.getItem(id);

    if (!item || !item.listbox)
        return;

    item.listbox.setValue(true);
};

LiteGUI.Tree.prototype.collapseItem = function(id) {
    let item = this.getItem(id);

    if (!item || !item.listbox)
        return;

    item.listbox.setValue(false);
};

/*
 * Prevent infinite recursion in keyboardJS
 */
keyboardJS.Keyboard.prototype._callerHandler = null;
keyboardJS.Keyboard.prototype._clearBindings = function(event) {
    event || (event = {});

    for (let i = 0; i < this._appliedListeners.length; i += 1) {
        let listener = this._appliedListeners[i];
        let keyCombo = listener.keyCombo;
        if (keyCombo === null || !keyCombo.check(this._locale.pressedKeys)) {
            if (this._callerHandler !== listener.releaseHandler) {
                listener.preventRepeat = listener.preventRepeatByDefault;
                // Record caller handler
                this._callerHandler = listener.releaseHandler;
                listener.releaseHandler.call(this, event);
                this._callerHandler = null;
                this._appliedListeners.splice(i, 1);
            }
            i -= 1;
        }
    }
};

(function() {
    function stopCallback(element) {
        // Don't trigger keyboard events inside a text field
        return element.tagName == 'INPUT'
            || element.tagName == 'TEXTAREA'
            || element.isContentEditable;
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
