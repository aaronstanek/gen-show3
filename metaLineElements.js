// metaLineElements.js
// high-level classes for placing multiple lines at once

'use strict';

class MetaLine {
    constructor(parents,children,info) {
        Check.array(parents);
        Check.array(children);
        Check.dictionary(info);
        for (let i = 0; i < parents.length; i++) {
            Check.objectType(parents[i],RowElement);
        }
        for (let i = 0; i < children.length; i++) {
            Check.objectType(children[i],RowElement);
        }
        this.parents = parents;
        this.children = children;
        this.info = info;
    }
    addLines(h,v) {
        exceptionMemo("addLines called on base class of MetaLine");
    }
}

class MetaLine1 extends MetaLine {
    // single horizontal line between parents and children
    constructor(parents,children,info) {
        super(parents,children,info);
    }
    addLines(h,v) {
        Check.objectType(h,HorizontalLineCollection);
        Check.objectType(v,VerticalLineCollection);
        var bar = new HorizontalLine(this.parents.concat(this.children),this.info);
        h.addLine(bar);
        for (let i = 0; i < this.parents.length; i++) {
            let pillar = new VerticalLine(this.parents[i],bar,this.info);
            v.addLine(pillar);
        }
        for (let i = 0; i < this.children.length; i++) {
            let pillar = new VerticalLine(this.children[i],bar,this.info);
            v.addLine(pillar);
        }
    }
}

class MetaLine2 extends MetaLine {
    // two horizontal lines, parents connected to one
    // children connected to the other, vertical lines connecting horizontals
    constructor(parents,children,info) {
        super(parents,children,info);
    }
    addLines(h,v) {
        Check.objectType(h,HorizontalLineCollection);
        Check.objectType(v,VerticalLineCollection);
        var bar1 = new HorizontalLine(this.parents,this.info);
        h.addLine(bar1);
        var bar2 = new HorizontalLine(this.children.concat([bar1]),this.info);
        h.addLine(bar2);
        for (let i = 0; i < this.parents.length; i++) {
            let pillar = new VerticalLine(this.parents[i],bar1,this.info);
            v.addLine(pillar);
        }
        for (let i = 0; i < this.children.length; i++) {
            let pillar = new VerticalLine(this.children[i],bar2,this.info);
            v.addLine(pillar);
        }
        let pillar = new VerticalLine(bar1,bar2,this.info);
        v.addLine(pillar);
    }
}

class MetaLine3 extends MetaLine {
    // two parents connected by a short horizontal line
    // optionally adds structure for children
    constructor(parents,children,info) {
        super(parents,children,info);
    }
    addLines(h,v) {
        Check.objectType(h,HorizontalLineCollection);
        Check.objectType(v,VerticalLineCollection);
        if (this.parents.length != 2) {
            exceptionMemo("Value Error");
        }
        var bar1 = new HorizontalLine(this.parents,this.info);
        h.addShort(bar1);
        if (this.children.length == 0) {
            return;
        }
        var bar2 = new HorizontalLine(this.children.concat([bar1]),this.info);
        h.addLine(bar2);
        for (let i = 0; i < this.children.length; i++) {
            let pillar = new VerticalLine(this.children[i],bar2,this.info);
            v.addLine(pillar);
        }
        let pillar = new VerticalLine(bar1,bar2,this.info);
        v.addLine(pillar);
    }
}