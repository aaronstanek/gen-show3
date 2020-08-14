// rowElements.js
// mid-level classes for handling inline elements

'use strict';

class RowElement {
    constructor(width,rightOf) {
         this.width = Check.nonnegative(width);
         this.rightOf = Check.nonnegative(rightOf);
    }
    render(y) {
        var d = "<div class=\"smalldiv\"></div>";
        var s = document.createElement("span");
        s.innerHTML = d;
        d = s.childNodes[0];
        d.style.left = Check.nonnegative(this.x) + "px";
        d.style.top = Check.nonnegative(y) + "px";
        document.getElementById("scrollRegion").appendChild(d);
        var output = new RenderedPosition(0,0,0,0,d);
        this.position = output;
        return output;
    }
}

class PointElement extends RowElement {
    constructor(info) {
        Check.dictionary(info);
        super(0,Extract.nonnegative(info,"rightOf",0));
    }
}

class BoxElement extends RowElement {
    constructor(info) {
        Check.dictionary(info);
        super(230,Extract.nonnegative(info,"rightOf",0));
        var textlist = [
            "image","image-url","name","name-url","born","born-url",
            "birthplace","birthplace-url","died","died-url",
            "deathplace","deathplace-url","box-url",
            "nickname","nickname-url","color","gender"
        ];
        for (let i = 0; i < textlist.length; i++) {
            let t = textlist[i];
            this[t] = Extract.text(info,t,"");
        }
        var comments = Extract.array(info,"comments",[]);
        for (let i = 0; i < comments.length; i++) {
            Check.text(comments[i]);
        }
        this.comments = comments;
    }
    render(y) {
        // takes stored parameters, and translates them into
        // a content array, which can be understood by the renderBox function
        var content = [];
        var info = {"x":this.x,"y":y};
        if (this.color.length != 0) {
            info.color = this.color;
        }
        if (this.gender.length != 0) {
            if (this.gender == "n") {
                info.radius = 0;
            }
            else if (this.gender == "m") {
                info.radius = 7.5;
            }
            else if (this.gender == "f") {
                info.radius = 15;
            }
            else {
                exceptionMemo("Value Error");
            }
        }
        if (this["box-url"].length != 0) {
            info.url = this["box-url"];
        }
        if (this.image.length != 0) {
            if (this["image-url"].length != 0) {
                content.push("url:"+this["image-url"]);
            }
            content.push("img:"+this.image);
        }
        if (this.name.length != 0) {
            if (this["name-url"].length != 0) {
                content.push("url:"+this["name-url"]);
            }
            content.push("name:"+this.name);
        }
        if (this.nickname.length != 0) {
            if (this["nickname-url"].length != 0) {
                content.push("url:"+this["nickname-url"]);
            }
            content.push("ital:"+this.nickname);
        }
        if (this.born.length != 0) {
            if (this["born-url"].length != 0) {
                content.push("url:"+this["born-url"]);
            }
            content.push("ital:b. "+this.born);
        }
        if (this.birthplace.length != 0) {
            if (this["birthplace-url"].length != 0) {
                content.push("url:"+this["birthplace-url"]);
            }
            if (this.born.length != 0) {
                content.push("ital:"+this.birthplace);
            }
            else {
                content.push("ital:b. "+this.birthplace);
            }
        }
        if (this.died.length != 0) {
            if (this["died-url"].length != 0) {
                content.push("url:"+this["died-url"]);
            }
            content.push("ital:d. "+this.died);
        }
        if (this.deathplace.length != 0) {
            if (this["deathplace-url"].length != 0) {
                content.push("url:"+this["deathplace-url"]);
            }
            if (this.died.length != 0) {
                content.push("ital:"+this.deathplace);
            }
            else {
                content.push("ital:d ."+this.deathplace);
            }
        }
        for (let i = 0; i < this.comments.length; i++) {
            content.push(this.comments[i]);
        }
        var p = renderBox(content,info);
        this.position = Check.objectType(p,RenderedPosition);
        return p;
    }
}

class BoxRow {
    constructor(info) {
        Check.dictionary(info);
        this.rightOf = Extract.number(info,"rightOf",0);
        this.boxes = [];
    }
    addElem(b) {
        Check.objectType(b,RowElement);
        this.boxes.push(b);
    }
    distribute() {
        var spot = this.rightOf;
        for (let i = 0; i < this.boxes.length; i++) {
            let b = this.boxes[i];
            spot += b.rightOf * 57.5;
            b.x = Check.nonnegative(spot);
            spot += b.width;
        }
    }
    searchForImages(elem,images) {
        if (elem.tagName == "IMG") {
            images.push(elem);
        }
        else {
            for (let i = 0; i < elem.childNodes.length; i++) {
                this.searchForImages(elem.childNodes[i],images);
            }
        }
    }
    render(y) {
        var images = [];
        var positions = [];
        for (let i = 0; i < this.boxes.length; i++) {
            let p = this.boxes[i].render(y);
            positions.push(p);
            this.searchForImages(p.obj,images);
        }
        return {"images":images,"boxPositions":positions};
    }
}

class BoxRowCollection {
    constructor() {
        this.rows = [];
    }
    addRow(r) {
        Check.objectType(r,BoxRow);
        this.rows.push(r);
    }
    distribute() {
        var right = 0;
        var leftmost = 0;
        for (let i = 0; i < this.rows.length; i++) {
            right += this.rows[i].rightOf;
            leftmost = Math.min(leftmost,right);
        }
        for (let i = 0; i < this.rows.length; i++) {
            let r = this.rows[i];
            let v = r.rightOf;
            v -= leftmost;
            v = Math.max(0,v);
            r.rightOf = Check.nonnegative(v);
        }
        for (let i = 0; i < this.rows.length; i++) {
            this.rows[i].distribute();
        }
    }
}
