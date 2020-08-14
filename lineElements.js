// lineElements.js
// mid-level classes for handling lines

'use strict';

class HorizontalLine {
    constructor(covers,info) {
        // coveres indicates elements that
        // this line should overlap with
        Check.nonemptyArray(covers);
        for (let i = 0; i < covers.length; i++) {
            if (covers[i] instanceof HorizontalLine) {
                continue;
            }
            Check.objectType(covers[i],RowElement);
        }
        this.covers = covers;
        Check.dictionary(info);
        this.color = Extract.text(info,"color","");
        this.dashed = Extract.bool(info,"dashed",false);
    }
    findLimits() {
        var xMin = Infinity;
        var xMax = -Infinity;
        for (let i = 0; i < this.covers.length; i++) {
            let elem = this.covers[i];
            let x;
            if (elem instanceof RowElement) {
                x = elem.x + (elem.width / 2.0);
            }
            else {
                // must be a HorizontalLine
                if (("xMin" in elem) && ("xMax" in elem)) {
                    x = (elem.xMin + elem.xMax) / 2.0;
                }
                else {
                    exceptionMemo("Horizontal Line Position Could Not Be Resolved");
                }
            }
            xMin = Math.min(xMin,x);
            xMax = Math.max(xMax,x);
        }
        this.xMin = Check.nonnegative(xMin);
        this.xMax = Check.nonnegative(xMax);
    }
    overlapsWith(other) {
        // checks if this line overlaps with another line
        Check.objectType(other,HorizontalLine);
        var blockLeft = other.xMin - 5;
        var blockRight = other.xMax + 5;
        if (blockLeft > this.xMax) {
            return false;
        }
        if (this.xMin > blockRight) {
            return false;
        }
        return true;
    }
    renderShort() {
        // renders inline, between two boxes
        if (this.covers.length != 2) {
            exceptionMemo("Value Error");
        }
        var yMin = Infinity;
        for (let i = 0; i < this.covers.length; i++) {
            Check.objectType(this.covers[i],BoxElement);
            let rp = Check.objectType(this.covers[i].position,RenderedPosition);
            let y = Check.nonnegative(rp.yCenter);
            yMin = Math.min(yMin,y);
        }
        Check.nonnegative(yMin);
        this.render(yMin);
    }
    render(y) {
        // renders below the boxes
        var info = {
            "xMin": this.xMin,
            "xMax": this.xMax,
            "y": y
        };
        if (this.color.length != 0) {
            info.color = this.color;
        }
        if (this.dashed) {
            info.dashed = true;
        }
        var p = renderHline(info);
        this.position = Check.objectType(p,RenderedPosition);
    }
}

class HorizontalLineCollection {
    constructor() {
        this.shorts = []; // lines to be rendered inline
        this.lines = []; // lines to be fully rendered
    }
    addShort(h) {
        Check.objectType(h,HorizontalLine);
        this.shorts.push(h);
    }
    addLine(h) {
        Check.objectType(h,HorizontalLine);
        this.lines.push(h);
    }
    _canFitOnLevel(h,s) {
        for (let i = 0; i < s.length; i++) {
            if (h.overlapsWith(s[i])) {
                return false;
            }
        }
        return true;
    }
    _assignLevel(h) {
        for (let i = 0; i < this.levels.length; i++) {
            if (this._canFitOnLevel(h,this.levels[i])) {
                this.levels[i].push(h);
                return;
            }
        }
        this.levels.push([h]);
    }
    assignLevels() {
        // determines vertical offset between horizontal lines
        this.levels = [];
        for (let i = 0; i < this.lines.length; i++) {
            this._assignLevel(this.lines[i]);
        }
    }
    distribute() {
        for (let i = 0; i < this.shorts.length; i++) {
            this.shorts[i].findLimits();
        }
        for (let i = 0; i < this.lines.length; i++) {
            this.lines[i].findLimits();
        }
        this.assignLevels();
    }
    render(y) {
        var yMax = Check.nonnegative(y);
        for (let i = 0; i < this.shorts.length; i++) {
            this.shorts[i].renderShort();
        }
        for (let i = 0; i < this.levels.length; i++) {
            let level = this.levels[i];
            let yHere = y + (57.5 * i);
            yMax = Math.max(yMax,yHere);
            for (let j = 0; j < level.length; j++) {
                level[j].render(yHere);
            }
        }
        return Check.nonnegative(yMax);
    }
}

class VerticalLine {
    constructor(anchor,limit,info) {
        var covers = [anchor,limit];
        for (let i = 0; i < covers.length; i++) {
            if (covers[i] instanceof HorizontalLine) {
                continue;
            }
            Check.objectType(covers[i],RowElement);
        }
        this.anchor = anchor;
        this.limit = limit;
        Check.dictionary(info);
        this.color = Extract.text(info,"color","");
        this.dashed = Extract.bool(info,"dashed",false);
    }
    computeX() {
        if (this.anchor instanceof RowElement) {
            let x = this.anchor.x + (this.anchor.width / 2.0);
            this.x = Check.nonnegative(x);
        }
        else {
            // must be a HorizontalLine
            if (("xMin" in this.anchor) && ("xMax" in this.anchor)) {
                let x = (this.anchor.xMin + this.anchor.xMax) / 2.0;
                this.x = Check.nonnegative(x);
            }
            else {
                exceptionMemo("Vertical Line Position Could Not Be Resolved");
            }
        }
    }
    render() {
        var y1 = Extract.nonnegativeHard(this.anchor.position,"yCenter");
        var y2 = Extract.nonnegativeHard(this.limit.position,"yCenter");
        var yMin = Math.min(y1,y2);
        var yMax = Math.max(y1,y2);
        var info = {
            "x": this.x,
            "yMin": yMin,
            "yMax": yMax
        };
        if (this.color.length != 0) {
            info.color = this.color;
        }
        if (this.dashed) {
            info.dashed = true;
        }
        var p = renderVline(info);
        this.position = Check.objectType(p,RenderedPosition);
    }
}

class VerticalLineCollection {
    constructor() {
        this.lines = [];
    }
    addLine(v) {
        Check.objectType(v,VerticalLine);
        this.lines.push(v);
    }
    computeX() {
        for (let i = 0; i < this.lines.length; i++) {
            this.lines[i].computeX();
        }
    }
    render() {
        for (let i = 0; i < this.lines.length; i++) {
            this.lines[i].render();
        }
    }
}