var Node    = require('./core/document/Node'),
    Panel   = require('./group/Panel'),
    Options = require('./component/Options'),
    Picker  = require('./component/Picker');

var CSS = require('./core/document/CSS');

var EventDispatcher = require('./core/event/EventDispatcher'),
    Event_          = require('./core/event/Event'),
    DocumentEvent   = require('./core/document/DocumentEvent'),
    NodeEvent       = require('./core/document/NodeEvent'),
    ComponentEvent  = require('./core/ComponentEvent'),
    HistoryEvent    = require('./core/HistoryEvent'),
    MenuEvent       = require('./group/MenuEvent');

var History = require('./core/History'),
    State   = require('./core/State');

var Mouse   = require('./core/document/Mouse');

var ValuePlotter = require('./component/ValuePlotter');
var StringOutput = require('./component/StringOutput'),
    NumberOutput = require('./component/NumberOutput');

var DEFAULT_HISTORY = false,
    DEFAULT_OPACITY = 1.0,
    DEFAULT_PANELS_CLOSABLE = false,
    DEFAULT_ENABLE = true,
    DEFAULT_LOAD_AND_SAVE = false;

var DEFAULT_TRIGGER_SHORTCUT_CHAR = 'h';

var initiated = false;

/**
 * Initializes ControlKit.
 * @param {Object} [options] - ControlKit options
 * @param {Number} [options.opacity=1.0] - Overall opacity
 * @param {Boolean} [options.enable=true] - Initial ControlKit state, enabled / disabled
 * @param {Boolean} [options.useExternalStyle=false] - If true, an external style is used instead of the build-in one
 * @param {String} [options.styleString] - If true, an external style is used instead of the build-in one
 * @param {Boolean}[options.history=false] - (Experimental) Enables a value history for all components
 */
function ControlKit(options) {
    if(initiated){
        throw new Error('ControlKit is already initialized.');
    }
    options                  = options || {};
    options.history          = options.history === undefined ? DEFAULT_HISTORY : options.history;
    options.loadAndSave      = options.loadAndSave === undefined ? DEFAULT_LOAD_AND_SAVE : options.loadAndSave;
    options.opacity          = options.opacity === undefined ? DEFAULT_OPACITY : options.opacity;
    options.panelsClosable   = options.panelsClosable === undefined ? DEFAULT_PANELS_CLOSABLE : options.panelsClosable;
    options.useExternalStyle = options.useExternalStyle === undefined ? false : options.useExternalStyle;
    options.enable           = options.enable === undefined ? DEFAULT_ENABLE : options.enable;

    EventDispatcher.apply(this, arguments);

    var node = null;
    if (!options.parentDomElementId) {
        node = new Node();
        document.body.appendChild(node.getElement());
    } else {
        node = Node.getNodeById(options.parentDomElementId);
    }

    if(!options.useExternalStyle){
        var style = document.createElement('style');
            style.type = 'text/css';
        var css = !options.style ? require('./core/document/Style').string : options.styleString;
        if(style.stylesheet){
            style.stylesheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        (document.head || document.getElementsByTagName('head')[0]).appendChild(style);
    }

    node.setProperty('id', CSS.ControlKit);

    this._node = node;
    this._panels = [];
    this._enabled = options.enable;
    this._historyEnabled = options.history;
    this._statesEnabled = options.loadAndSave;
    this._panelsClosable = options.panelsClosable;

    var history = History.setup();

    if (!this._historyEnabled){
        history.disable();
    } else {
        history.addEventListener(HistoryEvent.STATE_PUSH, this, 'onHistoryStatePush');
        history.addEventListener(HistoryEvent.STATE_POP, this, 'onHistoryStatePop');
    }

    Mouse.setup();
    Picker.setup(node);
    Options.setup(node);

    var opacity = options.opacity;
    if (opacity != 1.0 && opacity != 0.0) {
        node.setStyleProperty('opacity', opacity);
    }

    this._canUpdate = true;

    var self = this;

    var interval,
        count = 0,
        countMax = 10;

    window.addEventListener(DocumentEvent.WINDOW_RESIZE,function(){
        self._canUpdate = false;
        clearInterval(interval);
        interval = setInterval(function(){
            if(count >= countMax){
                count = 0;
                self._canUpdate = true;
                clearInterval(interval);
            }
            count++;
        },25)
    });

    this._shortcutEnable = DEFAULT_TRIGGER_SHORTCUT_CHAR;

    document.addEventListener('keydown',function(e){
        if(!(e.ctrlKey && String.fromCharCode(e.which || e.keyCode).toLowerCase() == self._shortcutEnable)){
            return;
        }
        self._enabled = !self._enabled;
        if(self._enabled){
            self._enable();
        } else {
            self._disable();
        }
    });

    if(!this._enabled){
        this._disable();
    }

    initiated = true;
}
ControlKit.prototype = Object.create(EventDispatcher.prototype);
ControlKit.prototype.constructor = ControlKit;

/**
 * Adds a panel.
 * @param {Object} [params] - Panel options
 * @param {String} [params.label='Control Panel'] - The panel label
 * @param {Number} [params.width=300] - The width
 * @param {Number} [params.height] - Constrained panel height
 * @param {Number} [params.ratio=40] - The ratio of label (default:40%) and component (default:60%) width
 * @param {String} [params.align='right'] - Float 'left' or 'right', multiple panels get aligned next to each other
 * @param {Boolean} [params.fixed=true] - If false the panel can be moved
 * @param {Array} [params.position=[0,0]] - If unfixed, the panel panel position relative to alignment (eg. if 'left' 0 + position[0] or if 'right' window.innerHeight - position[0] - panelWidth)
 * @param {Number} [params.opacity=1.0] - The panel´s opacity
 * @param {String} [params.dock=false] - (Experimental) Indicates whether the panel should be docked to either the left or right window border (depending on params.align), docked panels height equal window height
  * @returns {Panel}
 */
ControlKit.prototype.addPanel = function (params) {
    var panel = new Panel(this, params);
    this._panels.push(panel);
    return panel;
};

/**
 * Updates all ControlKit components if the wat
 */
ControlKit.prototype.update = function () {
    if (!this._enabled || !this._canUpdate){
        return;
    }
    var i, j, k;
    var l, m, n;
    var panels = this._panels,
        panel,
        groups,
        components,
        component;

    i = -1; l = panels.length;
    while (++i < l) {
        panel = panels[i];

        if (panel.isDisabled()){
            continue;
        }
        groups = panel.getGroups();
        j = -1; m = groups.length;

        while (++j < m) {
            components = groups[j].getComponents();
            k = -1; n = components.length;

            while (++k < n) {
                component = components[k];
                if (component.isDisabled()){
                    continue;
                }
                if (component instanceof ValuePlotter ||
                    component instanceof StringOutput ||
                    component instanceof NumberOutput) {
                    component.update();
                }
            }
        }
    }
};

ControlKit.prototype.historyIsEnabled = function () {
    return this._historyEnabled;
};

ControlKit.prototype.statesAreEnabled = function(){
    return this._statesEnabled;
};

ControlKit.prototype.panelsAreClosable = function () {
    return this._panelsClosable;
};

ControlKit.prototype._enable = function(){
    var i = -1, p = this._panels, l = p.length;
    while (++i < l){
        p[i].enable();
    }
    this._node.setStyleProperty('visibility', '');
};

ControlKit.prototype._disable = function(){
    var i = -1, p = this._panels, l = p.length;
    while (++i < l){
        p[i].disable();
    }
    this._node.setStyleProperty('visibility', 'hidden');
};

/**
 * Enables and shows controlKit.
 */

ControlKit.prototype.enable = function () {
    this._enable();
    this._enabled = true;
};

/**
 * Disable and hides controlKit.
 */

ControlKit.prototype.disable = function () {
    this._disable();
    this._enabled = false;
};


/**
 * Specifies the key to be used with ctrl & char, to trigger ControlKits visibility.
 * @param char
 */

ControlKit.prototype.setShortcutEnable = function(char){
    this._shortcutEnable = char;
};

ControlKit.prototype.onHistoryStatePush = function () {
    this.dispatchEvent(new Event_(this, MenuEvent.UPDATE_MENU, null));
};

ControlKit.prototype.onHistoryStatePop = function () {
    this.dispatchEvent(new Event_(this, ComponentEvent.UPDATE_VALUE, {origin: null}));
    this.dispatchEvent(new Event_(this, MenuEvent.UPDATE_MENU, null));
};

ControlKit.prototype.loadSettings = function(data){
    var i = -1, l = data.length;
    var panels = this._panels;
    while(++i < l){
        panels[i].setData(data[i]);
    }
};

ControlKit.prototype._loadState = function(){
    State.load(this.loadSettings.bind(this));
};

ControlKit.prototype._saveState = function(){
    this.update(); //force sync
    var p = this._panels, i = -1, l = p.length;
    var data = new Array(l);
    while(++i < l){
        data[i] = p[i].getData();
    }
    State.save({data:data});
};

/**
 * Returns the root element.
 * @returns {*}
 */

ControlKit.prototype.getNode = function () {
    return this._node;
};

ControlKit.destroy = function(){
    Mouse.get().destroy();
    Options.get().destroy();
    Picker.get().destroy();
    initiated = false;
};

module.exports = ControlKit;