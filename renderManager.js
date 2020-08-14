// renderManager.js
// mid-level class for organizing the rendering process

'use strict';

class RenderManager {
    constructor(boxes,h,v) {
        Check.objectType(boxes,BoxRowCollection);
        Check.array(h);
        for (let i = 0; i < h.length; i++) {
            Check.objectType(h[i],HorizontalLineCollection);
        }
        Check.array(v);
        for (let i = 0; i < v.length; i++) {
            Check.objectType(v[i],VerticalLineCollection);
        }
        this.boxes = boxes;
        this.h = h;
        this.v = v;
    }
    runX() {
        this.boxes.distribute();
        for (let i = 0; i < this.h.length; i++) {
            this.h[i].distribute();
        }
        for (let i = 0; i < this.v.length; i++) {
            this.v[i].computeX();
        }
    }
    runY() {
        // prepare for render cycle
        this.state = {
            "y": 0,
            "images": [],
            "boxPositions": [],
            "spot": 0,
            "goto": "_runYb",
            "pause": Date.now()
        };
        setTimeout(RenderManagerCallbackFunction,0,this);
    }
    _runYb() {
        // if there are more rows to render, render the next one, then goto _runYp
        // if there are not any more rows to render, goto _runYh
        if (this.state.spot >= this.boxes.rows.length) {
            this.state.goto = "_runYh";
            setTimeout(RenderManagerCallbackFunction,0,this);
            return;
        }
        // render the row specified by this.state.spot
        this.state.goto = "_runYp";
        setTimeout(RenderManagerCallbackFunction,0,this);
        var row = this.boxes.rows[this.state.spot];
        var res = row.render(this.state.y);
        this.state.images = Extract.arrayHard(res,"images");
        this.state.boxPositions = Extract.arrayHard(res,"boxPositions");
        this.state.pause = Date.now();
    }
    _runYp() {
        // check if all placed images have loaded yet
        // if yes, goto _runYh
        // if no, keep checking
        // if more than 5 seconds passes, then raise an exception
        var loaded = true;
        for (let i = 0; i < this.state.images.length; i++) {
            let img = this.state.images[i];
            if (!(img.complete)) {
                loaded = false;
                break;
            }
            if (img.naturalWidth == 0) {
                loaded = false;
                break;
            }
            if (img.naturalHeight == 0) {
                loaded = false;
                break;
            }
        }
        if (!loaded) {
            if (Date.now() - this.state.pause > 5000) {
                exceptionMemo("Timeout In Waiting For Images To Load");
            }
            setTimeout(RenderManagerCallbackFunction,5,this);
            return;
        }
        this.state.goto = "_runYh";
        setTimeout(RenderManagerCallbackFunction,0,this);
        for (let i = 0; i < this.state.boxPositions.length; i++) {
            let p = this.state.boxPositions[i];
            p.refresh();
            let yMax = Math.max(p.yMax,this.state.y);
            this.state.y = Check.nonnegative(yMax);
        }
    }
    _runYh() {
        // render the horizontal lines below the row that
        // was just rendered, then goto _runYz
        this.state.goto = "_runYz";
        setTimeout(RenderManagerCallbackFunction,0,this);
        if (this.state.spot >= this.h.length) {
            return;
        }
        var yMax = this.h[this.state.spot].render(this.state.y + 57.5);
        this.state.y = Check.nonnegative(yMax + 57.5);
    }
    _runYv() {
        // render all the vertical lines
        // then setScrollRegion
        for (let i = 0; i < this.v.length; i++) {
            this.v[i].render();
        }
        setTimeout(setScrollRegion,0);
    }
    _runYz() {
        // increment the row count
        // if there is more to render, goto _runYb
        // otherwise, goto _runYv
        var s = this.state.spot + 1;
        var run = false;
        if (s < this.boxes.rows.length) {
            run = true;
        }
        if (s < this.h.length) {
            run = true;
        }
        if (s < this.v.length) {
            run = true;
        }
        setTimeout(RenderManagerCallbackFunction,0,this);
        if (run) {
            this.state.spot = Check.nonnegative(s);
            this.state.goto = "_runYb";
        }
        else {
            this.state.goto = "_runYv";
        }
    }
}

function RenderManagerCallbackFunction(obj) {
    Check.objectType(obj,RenderManager);
    obj[obj.state.goto]();
}