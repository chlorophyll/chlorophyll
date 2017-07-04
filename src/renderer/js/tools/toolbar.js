import keyboardJS from 'keyboardjs';

/*
 * Toolbar manager
 *
 * Tracks state for active tools on a toolbar, creates buttons and hotkeys for
 * them.
 *
 * A tool can be anything with an enable() and disable() function.
 * Tool objects should not respond to any input after disable() has been called,
 * and should avoid carrying state from one invocation to the next.
 */
export default function Toolbar(managername, toolbar, menu) {

    let self = this;
    let tools = {};
    let activeTool = null;

    this.setActiveTool = function(name) {
        if (activeTool != null)
            self.exitActiveTool();

        if (typeof name === 'string')
            tool = tools[name];
        else
            tool = name;

        tool.enable();
        tool.ui_button.disabled = false;
        Util.hilightElement(tool.ui_button);
        activeTool = tool;
    };

    this.exitActiveTool = function() {
        if (activeTool === null)
            return;

        activeTool.disable();
        Util.unhilightElement(activeTool.ui_button);
        activeTool = null;
    };

    this.forEachTool = function(f) {
        for (name in tools) {
            if (tools.hasOwnProperty(name))
                f(tools[name]);
        }
    };

    this.enableButtons = function() {
        self.forEachTool(function(tool) {
            tool.ui_button.disabled = false;
            Util.unhilightElement(tool.ui_button);
        });
    };

    this.disableButtons = function() {
        self.forEachTool(function(tool) {
            tool.ui_button.disabled = true;
            Util.unhilightElement(tool.ui_button);
        });
    };

    this.addTool = function(name, tool, hotkey, momentary_hotkey) {
        tool.manager = self;

        let f = function() {
            self.setActiveTool(name);
        };

        let elem = toolbar.addButton(null, name, f);
        elem.classList.remove('even');
        elem = elem.querySelector('button');
        elem.disabled = true;

        keyboardJS.withContext('global', function() {
            keyboardJS.bind(hotkey, f);
            let prev_tool = null;
            if (typeof momentary_hotkey !== 'undefined') {
                keyboardJS.bind(momentary_hotkey, function() {
                    prev_tool = activeTool;
                    self.setActiveTool(name);
                }, function() {
                    self.setActiveTool(prev_tool);
                });
            }
        });

        if (menu)
            menu.add(managername+'/'+name, f);

        tool.ui_button = elem;

        tools[name] = tool;
    };
}
