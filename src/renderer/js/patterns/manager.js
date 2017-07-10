import keyboardJS from 'keyboardjs';
import Immutable from 'immutable';

import { UILayout, worldState, groupManager } from 'chl/init';
import Util from 'chl/util';
import GraphLib, { Graph, GraphCanvas, GraphAutoLayout } from 'chl/graphlib/graph';
import LiteGUI from 'chl/litegui';
import Const from 'chl/const';
// TODO It'd be convenient to have all the node registrations in one module
import 'chl/oscillators/nodes';
import 'chl/patterns/nodes';
import { MappingInputs } from 'chl/patterns/util';

let patternStages = ['precompute', 'pixel'];
let defaultStage = 'pixel';


function showNodePanel(node) {

    if (node.nodePanel) {
        console.log(node.nodePanel);
        node.nodePanel();
        return;
    }
    let visualization_root = undefined;

    function updateVisualization() {
        if (!node.visualization)
            return;

        if (node.visualization.enabled()) {
            if (!visualization_root) {
                dialog.add(node.visualization);
                visualization_root = node.visualization.root;
            }
            node.visualization.update();
        } else {
            if (visualization_root) {
                dialog.content.removeChild(visualization_root);
                visualization_root = undefined;
            }
        }
    }
    node.graph.addEventListener('graph-changed', updateVisualization);

    let inspector = new LiteGUI.Inspector('node-settings-inspector', {
        widgets_per_row: 3,
        onchange: updateVisualization,
    });


    let inputs = node.inputs || [];

    let old_values = {};
    let cur_values = node.properties;

    let show = false;
    let numShown= 0;

    function add(input, widget) {
        show = true;
        let disabled = (node.required_properties || []).indexOf(input.name) != -1;
        let checkbox;

        if (input.type.isUnit) {
            checkbox = inspector.addCheckbox(null, input.autoconvert, {
                name_width: '0',
                width: '2.7em',
                callback: function(val) {
                    input.autoconvert = val;
                }
            });
            checkbox.title = 'automatically convert input to appropriate unit';
            checkbox.querySelector('.wcontent .checkbox').style.width = '1.8em';
            checkbox.style.paddingRight = '1.2em';
        } else {
            checkbox = inspector.addInfo('', '<span style="display: inline-block />', {
                width: '2.7em',
                className: 'widget'
            });
        }

        let button = inspector.addButton(null, 'clear', {
            name_width: '0',
            disabled: disabled,
            callback: function() {
                widget.setValue(undefined);
                cur_values[input.name] = undefined;
            }
        });
        let name = widget.querySelector('.wname');
        name.style.width = '6em';
        widget.style.width = 'calc(99% - 6.5em)';
        button.classList.add('material-icons');
        button.style.fontSize = '12px';
        button.style.width = '3.5em';

        [widget, checkbox, button].forEach(function(el) {
            el.style.height = '2em';
            if (numShown % 2 == 0) {
                el.classList.add('even');
            } else {
                el.classList.remove('even');
            }
        });
    }

    inputs.forEach(function(input, i) {
        let val = node.properties[input.name];

        if (val !== undefined) {
            old_values[input.name] = Util.clone(val);
        }

        if (!input.type)
            return;

        if (input.type.isUnit) {
            let display = val !== undefined ? val.valueOf() : undefined;
            let precision = input.type.isIntegral ? 0 : 2;
            add(input, inspector.addNumber(input.name, display, {
                precision: precision,
                callback: function(v) {
                    cur_values[input.name] = v !== undefined ? new input.type(v) : undefined;
                }
            }));
        } else if (input.type == 'number') {
            let display = val !== undefined ? val.valueOf() : undefined;
            add(input, inspector.addNumber(input.name, display, {
                callback: function(v) {
                    cur_values[input.name] = v;
                }
            }));
        } else if (input.type == 'frequency') {
            let f = cur_values[input.name];
            add(input, inspector.addQuantity(input.name, f.quantity(), {
                step: 0.5,
                precision: 2,
                min: 0,
                units: val.units,
                callback: function(v, oldUnits) {
                    let number, units;
                    if (oldUnits !== undefined) {
                        number = f[v.units];
                        units = v.units;
                    } else {
                        number = v.number;
                        units = v.units;
                    }
                    f[units] = number;
                    f.setDisplayUnits(units);
                    return f.quantity();
                }
            }));
        } else if (input.type == 'range') {
            let range = cur_values[input.name];
            add(input, inspector.addDualSlider(input.name,
                {left: range.lower, right: range.upper},
                {
                    min: range.min,
                    max: range.max,
                    callback: function(v) {
                        range.lower = v.left;
                        range.upper = v.right;
                    }
                }
            ));
        }
    });

    if (!show) {
        return;
    }
    let dialog = new LiteGUI.Dialog('Node Settings', {
        title: node.title + ' Settings',
        minimize: false,
        width: 325,
        height: 'calc('+(numShown * 2)+'em + 300px)',
        scroll: true,
        resizeable: false,
        draggable: true,
        closable: false,
    });
    dialog.add(inspector);

    updateVisualization();

    function resetProperties() {
        for (let k in old_values) {
            node.properties[k] = old_values[k];
        }
        node.modified();
        node.graph.removeEventListener('graph-changed', updateVisualization);
    }

    function applyProperties() {
        node.modified();
        node.graph.removeEventListener('graph-changed', updateVisualization);
    }

    function autoclose(ev) {
        let removed = ev.detail.node;
        if (removed == node)
            dialog.close();
    }
    node.graph.addEventListener('node-removed', autoclose);

    dialog.on_close = function() {
        keyboardJS.setContext('global');
        node.graph.removeEventListener('node-removed', autoclose);
    };

    dialog.addButton('Ok', { close: true, callback: applyProperties});
    dialog.addButton('Cancel', { close: true, callback: resetProperties});

    keyboardJS.setContext('node-inspector');
    keyboardJS.bind('esc', function() {
        resetProperties();
        dialog.close();
    });
    keyboardJS.bind('enter', function() {
        applyProperties();
        dialog.close();
    });

    dialog.show();
}

export function PatternGraph(id, name, manager) {
    let self = this;
    self.name = name;
    self.id = id;
    self.tree_id = 'pattern-'+id;


    self.model = null;
    let request_id;

    self.curStage = defaultStage;

    Object.defineProperty(this, 'curStageGraph', {
        get: function() { return this.stages[this.curStage]; }
    });

    let running = false;

    this.stages = {};
    this.time = 0;

    for (let stage of patternStages) {
        let graph = new Graph();
        this.stages[stage] = graph;
        graph.addEventListener('node-opened', function(ev) {
            showNodePanel(ev.detail.node);
        });
    }

    let _mapping_type = Const.default_map_type;
    let map_input;

    function createMapInput() {
        if (map_input)
            self.stages.pixel.removeNode(map_input);
        map_input = self.stages.pixel.addNode('lowlevel/input/' + self.mapping_type, {title: 'input'});
    }

    Object.defineProperty(this, 'mapping_type', {
        get: function() { return _mapping_type; },
        set: function(v) {
            if (v == _mapping_type)
                return;
            _mapping_type = v;
            createMapInput();
            mapTypeDisplay.innerText = MappingInputs[_mapping_type].name;
        }
    });

    let elem = manager.pattern_browser.insertItem({
        id: self.tree_id,
        content: name,
        dataset: {pattern: self}},
        'root'
    );
    let mapTypeDisplay = document.createElement('span');
    mapTypeDisplay.classList.add('map-type');
    mapTypeDisplay.innerText = MappingInputs[_mapping_type].name;

    elem.querySelector('.postcontent').appendChild(mapTypeDisplay);

    function forEachStage(f) {
        for (let stage in self.stages) {
            f(stage, self.stages[stage]);
        }
    }

    forEachStage(function(stage, graph) {
        graph.fixedtime_lapse = 0;
    });

    this.stages['pixel'].addGlobalInput('coords');
    this.stages['pixel'].addGlobalInput('t');
    this.stages['pixel'].addGlobalInput('color');
    this.stages['pixel'].addGlobalOutput('outcolor');

    createMapInput();

    let outp = self.stages.pixel.addNode('lowlevel/output/color', {title: 'output'});
    outp.pos = [300, 100];

    forEachStage(function(stage, graph) {
        graph.addEventListener('graph-changed', function() {
            worldState.checkpoint();
        });
    });

    this.snapshot = function() {
        let stages = {};

        forEachStage(function(stage, graph) {
            stages[stage] = graph.snapshot();
        });

        return Immutable.fromJS({
            name: self.name,
            id: self.id,
            curStage: self.curStage,
            stages: stages
        });
    };

    this.restore = function(snapshot) {
        self.name = snapshot.get('name');
        self.id = snapshot.get('id');
        forEachStage(function(stage, graph) {
            self.stages[stage].restore(snapshot.getIn(['stages', stage]));
        });
    };

        this.stop = function() {
            if (!running)
                return;

            running = false;
            window.cancelAnimationFrame(request_id);
            self.model.displayOnly = false;
        };

        this.reset = function() {
            self.time = 0;
            self.model.updateColors();
        };

        this.run = function(mapping) {
            if (running)
                return;

            running = true;

            self.model = mapping.model;
            self.model.displayOnly = true;

            let graph = self.stages['pixel'];

            let positions = mapping.getPositions(self.mapping_type);

            function computePatternStep() {
                graph.setGlobalInputData('t', self.time);
                positions.forEach(function([idx, pos]) {
                    let dc = self.model.getDisplayColor(idx);
                    let incolor = new CRGB(dc[0], dc[1], dc[2]);
                    graph.setGlobalInputData('coords', pos.toArray());
                    graph.setGlobalInputData('color', incolor);
                    graph.runStep();
                    let outcolor = graph.getGlobalOutputData('outcolor');
                    self.model.setDisplayColor(idx, outcolor.r, outcolor.g, outcolor.b);
                });
                self.time += 1;
                self.model.updateColors();

                if (running)
                    request_id = window.requestAnimationFrame(computePatternStep);
            };

            request_id = window.requestAnimationFrame(computePatternStep);
        };
        this.destroy = function() {
            manager.pattern_browser.removeItem(self.tree_id);
        };
    }

export default function PatternManager() {
    let self = this;

    let _nextid = 0;
    function newgid() {
        return _nextid++;
    }

    let nameWidget;
    let stageWidget;
    let selectedMappingType = Const.default_map_type;
    let previewMappingList;

    let patterns = Immutable.Map();

    let curPattern = undefined;

    let clearCurrentPattern = function() {
        curPattern = null;
        self.graphcanvas.clearGraph();
        self.pattern_browser.setSelectedItem(null);
        nameWidget.setValue('', true);
    };

    let setCurrentPattern = function(pattern) {
        curPattern = pattern;

        if (!curPattern) {
            clearCurrentPattern();
            return;
        }

        self.graphcanvas.setGraph(curPattern.curStageGraph);
        self.pattern_browser.setSelectedItem(curPattern.tree_id);
        nameWidget.setValue(curPattern.name, true);
        setCurrentStage(curPattern.curStage);
    };

    function setCurrentStage(stage) {
        if (!curPattern)
            return;
        curPattern.curStage = stage;
        self.graphcanvas.setGraph(curPattern.curStageGraph);
        stageWidget.setValue(stage);
    }

    let init = function() {
        self.root = document.createElement('div');
        self.root.style.width = '100%';
        self.root.style.position = 'relative';
        self.root.style.height = '100%';
        self.top_widgets = new LiteGUI.Inspector(null, {
            one_line: true
        });

        self.sidebar_widgets = new LiteGUI.Inspector(null, {
            name_width: '4.5em'
        });
        self.pattern_browser = new LiteGUI.Tree('pattern-tree',
            {id: 'pattern-root', children: [], visible: false},
            {height: '100%', allow_rename: true}
        );

        self.pattern_browser.root.addEventListener('item_selected', function(e) {
            let dataset = e.detail.data.dataset;
            setCurrentPattern(dataset.pattern);
        });

        self.pattern_browser.root.addEventListener('item_renamed', function(e) {
            let dataset = e.detail.data.dataset;
            dataset.pattern.name = event.detail.new_name;
            if (curPattern == dataset.pattern) {
                nameWidget.setValue(curPattern.name, true);
            }
        });

        self.pattern_browser.onBackgroundClicked = function() {
            setCurrentPattern(null);
        };
        let side_tree_panel = new LiteGUI.Panel('pattern-tree-panel', {
            title: 'Pattern Browser',
            scroll: true
        });
        let side_settings_panel = new LiteGUI.Panel('pattern-settings', {
            scroll: true
        });

        side_tree_panel.add(self.pattern_browser);
        side_settings_panel.add(self.sidebar_widgets);
        UILayout.sidebar_bottom.split('vertical', ['50%', null], true);
        UILayout.sidebar_bottom.getSection(0).add(side_tree_panel);
        UILayout.sidebar_bottom.getSection(1).add(side_settings_panel);

        let runningPattern = false;
        let previewMapping = null;

        /* these are from Google's material icons; the text matters */
        let play = 'play_arrow';
        let pause = 'pause';
        let stop = 'stop';

        /*
         * Pattern editor top toolbar: Preview & editing options
         */
        let playButton = self.top_widgets.addButton(null, play, {
            width: 50,
            callback: function() {
            if (!curPattern)
                return;
            if (runningPattern) {
                curPattern.stop();
                this.setValue(play);
            } else {
                if (!previewMapping)
                    return;
                curPattern.run(previewMapping);
                this.setValue(pause);
            }
            runningPattern = !runningPattern;
        }});
        playButton.classList.add('material-icons');

        let stopButton = self.top_widgets.addButton(null, stop, {
            width: 50,
            callback: function() {
                if (!curPattern)
                    return;

                curPattern.stop();
                curPattern.reset();
                runningPattern = false;
                playButton.setValue(play);
            }
        });
        stopButton.classList.add('material-icons');


        function updatePreviewMapping(item) {
            previewMapping = item.mapping;
        }

        function updateMappingList() {
            let vals = [{title: ' ', mapping: undefined}];
            vals = vals.concat(groupManager.listMappings(selectedMappingType));
            let selected = undefined;

            vals.forEach(function(val) {
                if (val.mapping == previewMapping) {
                    selected = val;
                }
            });
            previewMappingList.setOptionValues(vals);

            previewMappingList.setValue(selected, true);
        }

        previewMappingList = self.top_widgets.addCombo('Preview map', null, {
            values: [],
            callback: updatePreviewMapping,
            width: '20em'
        });
        updateMappingList();

        groupManager.addEventListener('maplist_changed', updateMappingList);

        stageWidget = self.top_widgets.addComboButtons('stage: ', defaultStage, {
            values: patternStages,
            callback: setCurrentStage
        });

        let layoutButton = self.top_widgets.addButton(null, 'clear_all playlist_add_check', {
            width: 50,
            callback: function() {
                self.graphcanvas.autolayout();
            }
        });

        layoutButton.title = 'Automatically arrange graph';

        layoutButton.classList.add('material-icons');

        self.root.appendChild(self.top_widgets.root);
        self.top_widgets.root.style.paddingTop = '4px';
        self.top_widgets.root.style.paddingBottom = '4px';

        /*
         * Sidebar: browsing, creation, copying, and 'meta' settings
         */
        self.sidebar_widgets.widgets_per_row = 2;
        self.sidebar_widgets.addButton(null, 'New', { callback: newPattern });
        self.sidebar_widgets.addButton(null, 'Copy', { callback: copyPattern });
        self.sidebar_widgets.widgets_per_row = 1;

        self.sidebar_widgets.addSeparator();
        let mapmenu_values = {};
        for (let type in MappingInputs) {
            mapmenu_values[MappingInputs[type].name] = type;
        }
        self.sidebar_widgets.addCombo('map type',
            Const.default_map_type,
            {
                values: mapmenu_values,
                callback: function(val) {
                    selectedMappingType = val;

                    if (curPattern) {
                        curPattern.mapping_type = val;
                        worldState.checkpoint();
                    }

                    updateMappingList();
                }
            });

        self.sidebar_widgets.widgets_per_row = 2;
        nameWidget = self.sidebar_widgets.addString('name', '', {
            width: -Const.group_smallbutton_width,
            callback: function(v) {
                if (curPattern) {
                    curPattern.name = v;
                    manager.tree.updateItem(curPattern.tree_id, {
                        content: curPattern.name,
                        dataset: { pattern: curPattern }
                    });
                }
            }
        });
        let deleteButton = self.sidebar_widgets.addButton(null, 'delete', {
            width: Const.group_smallbutton_width,
            callback: function(v) {
                curPattern.destroy();
                setCurrentPattern(null);
                worldState.checkpoint();
            }
        });
        deleteButton.classList.add('material-icons');

        let area = self.area = new LiteGUI.Area(null, {
            className: 'grapharea',
            height: -38
        });
        self.root.appendChild(area.root);

        let canvasContainer = document.createElement('div');
        UILayout.tabs.addTab('Pattern Builder', {
            content: self.root,
            width: '100%',
            size: 'full',
        });
        area.split('horizontal', [210, null], true);
        area.getSection(1).add(canvasContainer);

        self.graphcanvas = new GraphCanvas(canvasContainer);

        let node_types = GraphLib.getNodeTypes();
        let nodes = {id: 'Nodes', children: []};

        node_types.forEach(function(node_type, path) {
            let ptr = nodes;
            let components = path.split('/');
            components.pop();
            components.forEach(function(component) {
                let idx = ptr.children.findIndex((el) => el.id == component);
                if (idx == -1) {
                    let n = {id: component, skipdrag: true, children: []};
                    ptr.children.push(n);
                    ptr = n;
                } else {
                    ptr = ptr.children[idx];
                }
            });
        });
        let nodeTree = new LiteGUI.Tree('node-list-tree', nodes, {
            height: '100%',
        });

        node_types.forEach(function(node_type, path) {
            let components = path.split('/');
            let elem = nodeTree.insertItem({
                id: path,
                skipdrag: true,
                content: components[components.length-1],
                dataset: {nodetype: path},
            }, components[components.length-2]);

            elem.draggable = true;
            elem.addEventListener('dragstart', function(ev) {
                ev.dataTransfer.setData('text/plain', path);
                ev.dataTransfer.dragEffect = 'link';
            });

            nodeTree.collapseItem(components[0]);
        });

        canvasContainer.addEventListener('dragover', function(ev) {
            if (self.graphcanvas.graph != null)
                ev.preventDefault();
        });

        canvasContainer.addEventListener('drop', function(ev) {
            let graph = self.graphcanvas.graph;
            if (graph == null)
                return;
            ev.preventDefault();
            let nodetype = ev.dataTransfer.getData('text');
            self.graphcanvas.dropNodeAt(nodetype, ev.clientX, ev.clientY);

        });

        let curNodeType = null;
        let curSelection = null;

        nodeTree.root.addEventListener('item_selected', function(ev) {
            let dataset = ev.detail.data.dataset;
            if (dataset && dataset.nodetype) {
                curNodeType = dataset.nodetype;
                curSelection = ev.detail.item;
            } else {
                if (curSelection)
                    nodeTree.markAsSelected(curSelection);
            }
        });

        canvasContainer.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            if (curNodeType) {
                self.graphcanvas.dropNodeAt(nodetype, ev.clientX, ev.clientY);
            }
        });


        let nodeTreePanel = new LiteGUI.Panel('node-list', {scroll: true});
        nodeTreePanel.content.style.height = '100%';
        nodeTreePanel.add(nodeTree);
        area.getSection(0).add(nodeTreePanel);


    };

    function newPattern() {
        let id = newgid();
        let name = 'pattern-'+id;
        let pattern = new PatternGraph(id, name, self);


        patterns = patterns.set(id, pattern);
        setCurrentPattern(pattern);
        pattern.mapping_type = selectedMappingType;

        worldState.checkpoint();

        console.log(pattern);
    };

    function copyName(name) {
        let re = / \(copy (\d+)\)$/;
        let result = re.exec(name);
        if (!result) {
            return name + ' (copy 1)';
        }
        let copydigits = parseInt(result[1]);
        let prefix = name.substring(0, result.index);
        return prefix + ' (copy '+(copydigits+1)+')';
    }

    function copyPattern() {
        if (!curPattern)
            return;

        let id = newgid();
        let name = copyName(curPattern.name);
        let snap = curPattern.snapshot();

        let pattern = new PatternGraph(id, name, self);
        pattern.restore(snap);
        pattern.id = id;
        pattern.name = name;

        patterns = patterns.set(id, pattern);
        setCurrentPattern(pattern);
        worldState.checkpoint();
    };

    this.snapshot = function() {
        let curPatternId = curPattern ? curPattern.id : null;
        return Immutable.Map({
            patterns: patterns.map(function(pattern, id) {
                return pattern.snapshot();
            }),
            curPattern: curPatternId
        });
    };

    this.restore = function(snapshot) {
        let newpatterns = snapshot.get('patterns').map(function(psnap, id) {
            let pattern = patterns.get(id);
            if (!pattern) {
                pattern = new PatternGraph(id, '', self);
            }
            pattern.restore(psnap);
            return pattern;
        });

        patterns.forEach(function(pattern, id) {
            if (!newpatterns.get(id)) {
                pattern.destroy();
            }
        });
        patterns = newpatterns;
        setCurrentPattern(patterns.get(snapshot.get('curPattern')));
    };

    init();
}
