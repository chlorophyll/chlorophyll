import * as THREE from 'three';
import * as d3 from 'd3';
import keyboardJS from 'keyboardjs';
import Hotkey from 'chl/keybindings';
import Util from 'chl/util';

/* This is a Coordinates2D object that has a describes a bunch of behaviors for letting the
 * user manipulate its position and angle. It also has callbacks to let display
 * code know what behaviors are happening at a time.
 *
 * (The callbacks should probably be rewritten to use events)
 */
export default function Widget2D(widgetElement, data_obj) {
    const self = this;

    this.x = data_obj.widget.x;
    this.y = data_obj.widget.y;
    this.angle = data_obj.widget.angle;

    let snap_angles = false;

    function notifyChange() {
        data_obj.widget = {
            x: self.x,
            y: self.y,
            angle: self.angle,
        };
    }

    /*
     * Control bindings: modifier keys and draggable areas
     */
    keyboardJS.bind(Hotkey.widget_snap_angles,
        function() { snap_angles = true; },
        function() { snap_angles = false; });

    this.update = function() {
        self.x = data_obj.widget.x;
        self.y = data_obj.widget.y;
        self.angle = data_obj.widget.angle;
        if (self.onPosChange)
            self.onPosChange(self.x, self.y);
        if (self.onAngleChange)
            self.onAngleChange(self.angle);
    };

    function _drag(event) {
        event.preventDefault();
        let coords = Util.relativeCoords(widgetElement, event.pageX, event.pageY);

        self.x =  (coords.x / widgetElement.clientWidth ) * 2 - 1;
        self.y = -(coords.y / widgetElement.clientHeight) * 2 + 1;
        if (self.onPosChange)
            self.onPosChange(self.x, self.y);
    }

    function _endDrag(event) {
        event.preventDefault();
        widgetElement.removeEventListener('mousemove', _drag);
        widgetElement.removeEventListener('mouseup', _endDrag);
        notifyChange();
    }

    this.dragBehavior = function(thing, start, end) {
        thing.on('mousedown', function() {
            self.dragging = true;
            if (start) start();
            widgetElement.addEventListener('mousemove', _drag);
            widgetElement.addEventListener('mouseup', function(event) {
                self.dragging = false;
                if (end) end(event);
                _endDrag(event);
            });
            d3.event.preventDefault();
        });
    };


    this.rotationBehavior = function(start, angleOffset) {
        return d3.drag().on('start', function() {
            self.rotating = true;
            start();
        }).on('drag', function() {
            let clk = new THREE.Vector2(d3.event.x, d3.event.y);
            self.angle += (clk.sub(self.origin).angle() + angleOffset);

            /* shift-snap to 15 degree angle increments */
            if (snap_angles) {
                self.angle = self.angle - (self.angle % (Math.PI / 12));
            }

            if (self.onAngleChange)
                self.onAngleChange(self.angle);
        }).on('end', function() {
            self.rotating = false;
            notifyChange();
        });
    };
}
