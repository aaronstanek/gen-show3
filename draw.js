// draw.js
// low level functions for putting lines and boxes on the screen
// systems for tracking where an element gets rendered
// and for dealing with overlapping lines

'use strict';

// RenderedPosition
// holds the position of an element
// broadly similar in funciton to .getBoundingClientRect()
// all positions are relative to the scrollRegion

class RenderedPosition {
    constructor(xMin,xMax,yMin,yMax,obj) {
        // obj is the DOM element
        this.xMin = Check.nonnegative(xMin);
        this.xMax = Check.nonnegative(xMax);
        this.xCenter = Check.nonnegative( (xMin + xMax) / 2.0 );
        this.yMin = Check.nonnegative(yMin);
        this.yMax = Check.nonnegative(yMax);
        this.yCenter = Check.nonnegative( (yMin + yMax) / 2.0 );
        this.obj = obj;
    }
    getRenderAnchor() {
        // returns the position of the scrollRegion
        var rect = document.getElementById("scrollRegion").getBoundingClientRect();
        return {"x":rect.left,"y":rect.top};
    }
    refresh() {
        // updates the values in this object to match the DOM
        // used after images have loaded
        var anchor = this.getRenderAnchor();
        var rect = this.obj.getBoundingClientRect();
        this.xMin = Check.nonnegative( rect.left - anchor.x );
        this.xMax = Check.nonnegative( rect.right - anchor.x );
        this.xCenter = Check.nonnegative( (this.xMin + this.xMax) / 2.0 );
        this.yMin = Check.nonnegative( rect.top - anchor.y );
        this.yMax = Check.nonnegative( rect.bottom - anchor.y );
        this.yCenter = Check.nonnegative( (this.yMin + this.yMax) / 2.0 );
    }
}

function setPrintSize() {
    // updates the style of the document such that the default page size
    // while printing is slightly larger than the body and/or tree
    // this is the last bit of code that runs in the program
    var rect1 = document.getElementById("scrollRegion").getBoundingClientRect();
    var rect2 = document.body.getBoundingClientRect();
    var xMin = Math.min(rect1.left-57.5,rect2.left);
    var xMax = Math.max(rect1.right,rect2.right);
    var yMin = Math.min(rect1.top-57.5,rect2.top);
    var yMax = Math.max(rect1.bottom,rect2.bottom);
    // between the body and the tree, find the largest area that
    // we need to cover
    var x = xMax - xMin;
    var y = yMax - yMin;
    var s = "size: " + x + "px " + y + "px;";
    s = "@page {" + s + "}";
    s = "@media print {" + s + "}";
    s = "<style>" + s + "</style>";
    var span = document.createElement("span");
    span.innerHTML = s;
    document.head.appendChild(span.childNodes[0]);
}

function setScrollRegion() {
    // set the size of the scrollRegion to match the size of the tree
    // without this you can't scroll through the entire tree
    // used later to set the print size
    setTimeout(setPrintSize,0);
    var xMax = 0;
    var yMax = 0;
    // find the greatest x and y coordinates relative to the scrollRegion
    for (let i = 0; i < setScrollRegion.positions.length; i++) {
        let p = setScrollRegion.positions[i];
        let x = Check.nonnegative(p.xMax);
        let y = Check.nonnegative(p.yMax);
        xMax = Math.max(xMax,x);
        yMax = Math.max(yMax,y);
    }
    // add a bit of margin space
    xMax += 57.5;
    yMax += 57.5;
    var sr = document.getElementById("scrollRegion");
    sr.style.width = Check.nonnegative(xMax) + "px";
    sr.style.height = Check.nonnegative(yMax) + "px";
    delete setScrollRegion.positions;
}

// remember the position of every single box that gets rendered
setScrollRegion.positions = [];

function renderBox(content,info) {
    // renders a box with particular content
    // at a particular location
    // returns a RenderedPosition with the location of the box
    Check.nonemptyArray(content);
    Check.dictionary(info);
    var x = Extract.nonnegativeHard(info,"x");
    var y = Extract.nonnegativeHard(info,"y");
    // contents is array of strings
    // see BoxElement.render for the format of these strings
    // info is object
    // info.x info.y are required nonnegative numbers
    // info.color is optional string (valid CSS color)
    // info.radius is optional nonnegative number
    var t = "";
    var url = "";
    for (let i = 0; i < content.length; i++) {
        // check to see if the string begins with a valid command
        // if yes, do that command, if no then treat it like plain text
        let ci = Check.text(content[i]);
        let c;
        if (ci.slice(0,4) == "img:") {
            c = "<img src=\""+ci.slice(4)+"\">";
        }
        else if (ci.slice(0,5) == "name:") {
            c = "<p class=\"name\">" + ci.slice(5) + "</p>";
        }
        else if (ci.slice(0,4) == "big:") {
            c = "<p class=\"big\">" + ci.slice(4) + "</p>";
        }
        else if (ci.slice(0,5) == "ital:") {
            c = "<p class=\"ital\">" + ci.slice(5) + "</p>";
        }
        else if (ci.slice(0,4) == "url:") {
            url = ci.slice(4);
            continue;
        }
        else {
            c = "<p>" + ci + "</p>";
        }
        if (url.length != 0) {
            c = "<a href=\""+url+"\">" + c +"</a>";
            url = "";   
        }
        t += c;
    }
    t = "<div class=\"box\">" + t + "</div>";
    var span = document.createElement("span");
    span.innerHTML = t;
    var box = span.childNodes[0];
    box.style.left = x + "px";
    box.style.top = y + "px";
    box.style.borderColor = Extract.text(info,"color","black");
    box.style.borderRadius = Extract.nonnegative(info,"radius",0) + "px";
    var boxurl = Extract.text(info,"url","");
    if (boxurl.length == 0) {
        // the box does not have a box-url, we can render it as is
        document.getElementById("scrollRegion").appendChild(box);
    }
    else {
        // the box has a box-url, we have to wrap it in an a tag
        let a = document.createElement("a");
        a.href = boxurl;
        a.appendChild(box);
        document.getElementById("scrollRegion").appendChild(a);
    }
    var output = new RenderedPosition(0,0,0,0,box);
    output.refresh();
    setScrollRegion.positions.push(output);
    return output;
}

function renderHline(info) {
    // renders a horizontal line at a particualr location
    // returns a RenderedPosition with the location of the line
    // remembers the location of the line in an HlineMemoryBlock called RENDERMEMORY
    Check.dictionary(info);
    var xMin = Extract.nonnegativeHard(info,"xMin");
    var xMax = Extract.nonnegativeHard(info,"xMax");
    var y = Extract.nonnegativeHard(info,"y");
    // info.xMin info.xMax info.y are nonnegative numbers
    if (xMax <= xMin) {
        return new RenderedPosition(xMax, xMin, y, y, null);
    }
    var len = (xMax - xMin) + 5;
    var color = Extract.text(info,"color","black");
    var dash = "";
    if (Extract.bool(info,"dashed",false)) {
        dash = ";stroke-dasharray:4";
    }
    var t = "<line x1=\"0\" x2=\""+len+"\" y1=\"2.5\" y2=\"2.5\" style=\"stroke:"+color+";stroke-width:5"+dash+"\" />";
    t = "<svg height=\"5\" width=\""+len+"\">" + t + "</svg>";
    var span = document.createElement("span");
    span.innerHTML = t;
    var line = span.childNodes[0];
    line.style.left = (xMin - 2.5) + "px";
    line.style.top = (y - 2.5) + "px";
    line.style.zIndex = 1;
    document.getElementById("scrollRegion").appendChild(line);
    var output = new RenderedPosition(xMin, xMax, y, y, line);
    RENDERMEMORY.addHline(output);
    return output;
}

function renderVline(info) {
    // renders a horizontal line at a particualr location
    // returns a RenderedPosition with the location of the line
    // instructs RENDERMEMORY to check for overlaps with horizontal lines
    // and to take appropriate action
    Check.dictionary(info);
    var x = Extract.nonnegativeHard(info,"x");
    var yMin = Extract.nonnegativeHard(info,"yMin");
    var yMax = Extract.nonnegativeHard(info,"yMax");
    // info.x info.yMin info.yMax are nonnegative numbers
    if (yMax <= yMin) {
        return new RenderedPosition(x, x, yMax, yMin, null);
    }
    var len = (yMax - yMin) + 5;
    var color = Extract.text(info,"color","black");
    var dash = "";
    if (Extract.bool(info,"dashed",false)) {
        dash = ";stroke-dasharray:4";
    }
    var t = "<line x1=\"2.5\" x2=\"2.5\" y1=\"0\" y2=\""+len+"\" style=\"stroke:"+color+";stroke-width:5"+dash+"\" />";
    t = "<svg height=\""+len+"\" width=\"5\">" + t + "</svg>";
    var span = document.createElement("span");
    span.innerHTML = t;
    var line = span.childNodes[0];
    line.style.left = (x - 2.5) + "px";
    line.style.top = (yMin - 2.5) + "px";
    line.style.zIndex = 3;
    document.getElementById("scrollRegion").appendChild(line);
    var output = new RenderedPosition(x, x, yMin, yMax, line);
    RENDERMEMORY.addVline(output);
    return output;
}

function renderBline(info) {
    // renders a white block at the intersection between a horizontal
    // and vertical line to make it clear the the lines do not intersect
    // returns a RenderedPosition with the location of the block
    Check.dictionary(info);
    var x = Extract.nonnegativeHard(info,"x");
    var y = Extract.nonnegativeHard(info,"y");
    var t = "<line x1=\"0\" x2=\"15\" y1=\"7.5\" y2=\"7.5\" style=\"stroke:white;stroke-width:15\" />";
    t = "<svg height=\"15\" width=\"15\">"+t+"</svg>";
    var span = document.createElement("span");
    span.innerHTML = t;
    var line = span.childNodes[0];
    line.style.left = (x - 7.5) + "px";
    line.style.top = (y - 7.5) + "px";
    line.style.zIndex = 2;
    document.getElementById("scrollRegion").appendChild(line);
    return new RenderedPosition(x,x,y,y,line);
}

// HlineMemoryBlock
// remembers the location of every horizontal line that gets rendered
// when a vertical line is rendered, it will determine if it overlaps
// with a horizontal line with which it does not connect
// connectedness is determined by the positions of the endpoints of the lines
// places a Bline at every nonconnected intersection
// divides the renderspace into 100px by 100px blocks to speed up lookups
// a reference to a horizontal line is placed in each block that the line occupies
// vertical lines are checked against only those blocks that they occupy

class HlineMemoryBlock {
    constructor() {
        this.lines = {};
    }
    static _determineBlock(c) {
        return parseInt(Math.floor(c / 100));
    }
    static _getBlockList(rp) {
        // returns an array of all the blocks in the region specified by rp
        var xMin = HlineMemoryBlock._determineBlock(rp.xMin - 5);
        var xMax = HlineMemoryBlock._determineBlock(rp.xMax + 5);
        var yMin = HlineMemoryBlock._determineBlock(rp.yMin - 5);
        var yMax = HlineMemoryBlock._determineBlock(rp.yMax + 5);
        var output = [];
        for (let x = xMin; x <= xMax; x++) {
            let xo = parseInt(Math.round(x));
            for (let y = yMin; y <= yMax; y++) {
                let yo = parseInt(Math.round(y));
                output.push([xo,yo]);
            }
        }
        return output;
    }
    _addToBlock(xBlock,yBlock,rp) {
        // places rp into the block xBlock,yBlock
        // creating the block if it does not exist
        var h = this.lines[xBlock];
        if (typeof h == "undefined") {
            h = {};
            this.lines[xBlock] = h;
        }
        var v = h[yBlock];
        if (typeof v == "undefined") {
            v = [];
            h[yBlock] = v;
        }
        v.push(rp);
    }
    addHline(rp) {
        // adds rp to every block that it occupies
        Check.objectType(rp,RenderedPosition);
        var blocks = HlineMemoryBlock._getBlockList(rp);
        for (let i = 0; i < blocks.length; i++) {
            let b = blocks[i];
            this._addToBlock(b[0],b[1],rp);
        }
    }
    _loadBlock(xBlock,yBlock) {
        // returns a particular block
        // returning an empty block if the block does not exist
        var h = this.lines[xBlock];
        if (typeof h == "undefined") {
            return [];
        }
        var v = h[yBlock];
        if (typeof v == "undefined") {
            return [];
        }
        return v;
    }
    addVline(rp) {
        // loads all blocks occupied by rp
        // and only those blocks occupied by rp
        // checks every line in these blocks against the line specified by rp
        // finds nonconnecting overlaps
        // creates Bline where there is a nonconnecting overlap
        Check.objectType(rp,RenderedPosition);
        var blocks = HlineMemoryBlock._getBlockList(rp);
        var x = rp.xCenter;
        for (let i = 0; i < blocks.length; i++) {
            let b = blocks[i];
            let block = this._loadBlock(b[0],b[1]);
            for (let j = 0; j < block.length; j++) {
                let h = block[j];
                let y = h.yCenter;
                // check to see if the horizontal line is above or below
                // the vertical line (can't overlap)
                if (y > rp.yMax+1) {
                    continue;
                }
                if (y < rp.yMin-1) {
                    continue;
                }
                // check to see if the horizontal line if fully to the right
                // or fully to the left of the vertical line (can't overlap)
                if (h.xMax < x-1) {
                    continue;
                }
                if (h.xMin > x+1) {
                    continue;
                }
                // they must intersect at exactly one point
                // check to see if the horizontal line's endpoints are on
                // on top of the vertical line (they connect)
                if (Math.abs(h.xMax - x) < 1) {
                    continue;
                }
                if (Math.abs(h.xMin - x) < 1) {
                    continue;
                }
                // check to see if the vertical line's endpoints are on
                // top of the horizontal line (they connect)
                if (Math.abs(rp.yMax - y) < 1) {
                    continue;
                }
                if (Math.abs(rp.yMin - y) < 1) {
                    continue;
                }
                // the lines intersect but do not connect
                renderBline({"x":x,"y":y});
            }
        }
    }
}

var RENDERMEMORY = new HlineMemoryBlock();