var AbstractGroup = require('./AbstractGroup');
var CSS = require('../core/document/CSS');
var Node = require('../core/document/Node');

var SubGroup = require('./SubGroup');

var Event_ = require('../core/event/Event'),
    DocumentEvent = require('../core/document/DocumentEvent'),
    NodeEvent = require('../core/document/NodeEvent'),
    PanelEvent = require('./PanelEvent'),
    GroupEvent = require('./GroupEvent');

var ObjectComponent = require('../core/ObjectComponent'),
    ValuePlotter    = require('../component/ValuePlotter'),
    FunctionPlotter = require('../component/FunctionPlotter');

function Group(parent,params) {
    params           = params || {};
    params.label     = params.label     || null;
    params.useLabels = params.useLabels || true;
    params.enable    = params.enable     === undefined ? true : params.enable;

    AbstractGroup.apply(this,arguments);

    this._components = [];
    this._subGroups  = [];

    var root = this._node,
        wrap = this._wrapNode,
        list = this._listNode;

        root.setStyleClass(CSS.Group);
        wrap.setStyleClass(CSS.Wrap);
        list.setStyleClass(CSS.SubGroupList);

        wrap.addChild(list);

    var label = params.label;

    if(label){
        var head  = new Node(),
            wrap_ = new Node(),
            label_  = new Node(Node.SPAN),
            indicator = this._indiNode = new Node();

            head.setStyleClass(CSS.Head);
            wrap_.setStyleClass(CSS.Wrap);
            label_.setStyleClass(CSS.Label);
            indicator.setStyleClass(CSS.ArrowBMax);
            label_.setProperty('innerHTML',label);

            head.addChild(indicator);
            wrap_.addChild(label_);
            head.addChild(wrap_);
            root.addChild(head);

        head.addEventListener(NodeEvent.MOUSE_DOWN,this._onHeadTrigger.bind(this));
        this.addEventListener(GroupEvent.GROUP_LIST_SIZE_CHANGE,parent,'onGroupListSizeChange');

        this._updateAppearance();
    }

    if(this.hasMaxHeight()){
        this.addScrollWrap();
    }

    root.addChild(wrap);

    if(this.hasMaxHeight()){
        if(!label){
            var bufferTop = this._scrollBufferTop = new Node();
                bufferTop.setStyleClass(CSS.ScrollBuffer);

            root.addChildAt(bufferTop,0);
        }
        var bufferBottom = this._scrollBufferBottom = new Node();
            bufferBottom.setStyleClass(CSS.ScrollBuffer);

        root.addChild(bufferBottom);
    }

    parent = this._parent;

    parent.addEventListener(PanelEvent.PANEL_MOVE_BEGIN, this, 'onPanelMoveBegin');
    parent.addEventListener(PanelEvent.PANEL_MOVE, this, 'onPanelMove');
    parent.addEventListener(PanelEvent.PANEL_MOVE_END, this, 'onPanelMoveEnd');
    parent.addEventListener(PanelEvent.PANEL_HIDE, this, 'onPanelHide');
    parent.addEventListener(PanelEvent.PANEL_SHOW, this, 'onPanelShow');
    parent.addEventListener(PanelEvent.PANEL_SCROLL_WRAP_ADDED, this, 'onPanelScrollWrapAdded');
    parent.addEventListener(PanelEvent.PANEL_SCROLL_WRAP_REMOVED, this, 'onPanelScrollWrapRemoved');
    parent.addEventListener(PanelEvent.PANEL_SIZE_CHANGE, this, 'onPanelSizeChange');
    parent.addEventListener(DocumentEvent.WINDOW_RESIZE, this, 'onWindowResize');

    this.addEventListener(GroupEvent.GROUP_SIZE_CHANGE,parent,'onGroupListSizeChange');
}
Group.prototype = Object.create(AbstractGroup.prototype);
Group.prototype.constructor = Group;

Group.prototype.onPanelMoveBegin = function () {
    this.dispatchEvent(new Event_(this, PanelEvent.PANEL_MOVE_BEGIN, null));
};

Group.prototype.onPanelMove = function () {
    this.dispatchEvent(new Event_(this, PanelEvent.PANEL_MOVE, null));
};

Group.prototype.onPanelMoveEnd = function () {
    this.dispatchEvent(new Event_(this, PanelEvent.PANEL_MOVE_END, null));
};

Group.prototype.onPanelScrollWrapAdded = function () {
    this.dispatchEvent(new Event_(this, GroupEvent.GROUP_SIZE_CHANGE, null));
};

Group.prototype.onPanelScrollWrapRemoved = function () {
    this.dispatchEvent(new Event_(this, GroupEvent.GROUP_SIZE_CHANGE, null));
};

Group.prototype.onPanelHide = function () {
    this.dispatchEvent(new Event_(this, GroupEvent.SUBGROUP_DISABLE, null));
};

Group.prototype.onPanelShow = function () {
    this.dispatchEvent(new Event_(this, GroupEvent.SUBGROUP_ENABLE, null));
};

Group.prototype.onPanelSizeChange = function () {
    this.dispatchEvent(new Event_(this, GroupEvent.GROUP_SIZE_CHANGE, null));
};

Group.prototype.onWindowResize = function (e) {
    this.dispatchEvent(e);
};

Group.prototype.onSubGroupTrigger = function () {
    this._updateHeight();

    if(!this.hasMaxHeight()){
        return;
    }
    var scrollBar = this._scrollBar,
        wrap  = this._wrapNode;
    var bufferTop    = this._scrollBufferTop,
        bufferBottom = this._scrollBufferBottom;

    scrollBar.update();

    if (!scrollBar.isValid()) {
        scrollBar.disable();
        wrap.setHeight(wrap.getChildAt(1).getHeight());
        if (bufferTop){
            bufferTop.setStyleProperty('display', 'none');
        }
        if (bufferBottom){
            bufferBottom.setStyleProperty('display', 'none');
        }
    }
    else {
        scrollBar.enable();
        wrap.setHeight(this.getMaxHeight());

        if (bufferTop){
            bufferTop.setStyleProperty('display', 'block');
        }
        if (bufferBottom){
            bufferBottom.setStyleProperty('display', 'block');
        }
    }
    this.dispatchEvent(new Event_(this,GroupEvent.GROUP_SIZE_CHANGE,null));
};

Group.prototype._onHeadTrigger = function () {
    this._enabled = !this._enabled;
    this._updateAppearance();
    this.dispatchEvent(new Event_(this, GroupEvent.GROUP_LIST_SIZE_CHANGE, null));
};

Group.prototype.addComponent = function(){
    var Class_ = arguments[0];
    var args   = Array.prototype.slice.call(arguments);
        args.shift();
        args.unshift(this._getSubGroup());

    var instance = Object.create(Class_.prototype);
    Class_.apply(instance,args);

    this._components.push(instance);
    this._updateHeight();
};

Group.prototype._updateHeight = function () {
    this._getSubGroup().update();
    this.dispatchEvent(new Event_(this,GroupEvent.GROUP_SIZE_CHANGE,null));
    if(this.hasMaxHeight()){
        this._scrollBar.update();
    }
};

Group.prototype._updateAppearance = function () {
    var wrap = this._wrapNode,
        indicator = this._indiNode;

    var scrollBar = this._scrollBar;

    var bufferTop    = this._scrollBufferTop,
        bufferBottom = this._scrollBufferBottom;

    if (this.isDisabled()) {
        wrap.setHeight(0);
        if (indicator){
            indicator.setStyleClass(CSS.ArrowBMin);
        }

        if (scrollBar) {
            if (bufferTop){
                bufferTop.setStyleProperty('display', 'none');
            }
            if (bufferBottom){
                bufferBottom.setStyleProperty('display', 'none');
            }
        }
        return;
    }

    if (this.hasMaxHeight()) {
        var maxHeight = this.getMaxHeight(),
            listHeight = wrap.getChildAt(1).getHeight();

        wrap.setHeight(listHeight < maxHeight ? listHeight : maxHeight);

        if (scrollBar.isValid()) {
            if (bufferTop){
                bufferTop.setStyleProperty('display', 'block');
            }
            if (bufferBottom){
                bufferBottom.setStyleProperty('display', 'block');
            }
        }
    }
    else {
        wrap.deleteStyleProperty('height');
    }
    if (indicator){
        indicator.setStyleClass(CSS.ArrowBMax);
    }
};

Group.prototype.onGroupSizeUpdate = function () {
    this._updateAppearance();
    if (this.hasMaxHeight()){
        this._scrollBar.update();
    }
};

Group.prototype.addSubGroup = function (params) {
    this._subGroups.push(new SubGroup(this, params));
    this._updateHeight();
    return this;
};

Group.prototype._getSubGroup = function () {
    var subGroups = this._subGroups;
    if (subGroups.length == 0){
        subGroups.push(new SubGroup(this));
    }
    return subGroups[subGroups.length - 1];
};

Group.prototype.getComponents = function () {
    return this._components;
};

function isDataComp(comp){
    return  (comp instanceof ObjectComponent) &&
           !(comp instanceof ValuePlotter) &&
           !(comp instanceof FunctionPlotter);
}


Group.prototype.setData = function(data){
    var comps = this._components, comp, data_;
    var i = -1, j = 0, l = comps.length;
    while(++i < l){
        comp = comps[i];
        if(!isDataComp(comp)){
            continue;
        }
        data_ = data[j++];
        comp.setValue(data_[Object.keys(data_)[0]]);
    }
};

Group.prototype.getData = function(){
    var comps = this._components,
        i = -1, l = comps.length;
    var values = [];
    var comp;
    while(++i < l){
        comp = comps[i];
        if(!isDataComp(comp)){
            continue;
        }
        values.push(comp.getData());
    }
    return values;
};

module.exports = Group;
