// autoAlign.js
// mid level functions and classes for horizontal placement of boxes and points

'use strict';

// autoAlignArrayAverage functions find the average of
// an array and then divide it by a constant
// use anonymous functions to speed up later operations

// _autoAlignArrayAverage{number of elements in array}_{divide by this number}

function _autoAlignArrayAverage_4(arr) {
    // likely to be called multiple times with the
    // same input values
    // use memoization to reduce redundant computing
    const al = arr.length;
    const ad = al * 4.0;
    var hold = [-5,null];
    return (prevRow) => {
        if (prevRow == hold[0]) {
            return hold[1];
        }
        var total = 0.0;
        for (let i = 0; i < al; i++) {
            total += arr[i].c;
        }
        total /= ad;
        hold[0] = prevRow;
        hold[1] = total;
        return total;
    };
}

function _autoAlignArrayAverage_2(arr) {
    const al = arr.length;
    const ad = al * 2.0;
    return () => {
        var total = 0.0;
        for (let i = 0; i < al; i++) {
            total += arr[i].c;
        }
        return total / ad;
    };
}

function _autoAlignArrayAverage1_4(arr) {
    const a = arr[0];
    return () => {
        return a.c / 4.0;
    };
}

function _autoAlignArrayAverage1_2(arr) {
    const a = arr[0];
    return () => {
        return a.c / 2.0;
    };
}

function _autoAlignArrayAverage2_4(arr) {
    const a = arr[0];
    const b = arr[1];
    return () => {
        return (a.c + b.c) / 8.0;
    };
}

function _autoAlignArrayAverage2_2(arr) {
    const a = arr[0];
    const b = arr[1];
    return () => {
        return (a.c + b.c) / 4.0;
    };
}

function _autoAlignArrayAverage3_4(arr) {
    const a = arr[0];
    const b = arr[1];
    const c = arr[2];
    return () => {
        return (a.c + b.c + c.c) / 12.0;
    };
}

function _autoAlignArrayAverage3_2(arr) {
    const a = arr[0];
    const b = arr[1];
    const c = arr[2];
    return () => {
        return (a.c + b.c + c.c) / 6.0;
    };
}

// autoAlignComp computes the ideal position of a given box or point
// use anonymous functions to speed up later operations
// _autoAlignComp_4 is memoized because it is extremely likely to
// receive the same input multiple times
// cache is in _autoAlignComp_4.memory and has the format:
// {id of first element in array}{length of array}[index of cached result]

function _autoAlignComp_4(arr,len) {
    // check to see if this input has been entered before
    // if yes, return cached result
    if (arr[0].nodeNum in _autoAlignComp_4.memory) {
        let m1 = _autoAlignComp_4.memory[arr[0].nodeNum];
        if (len in m1) {
            let m2 = m1[len];
            for (let i = 0; i < m2.length; i++) {
                let maybeNums = m2[i][0];
                let match = true;
                for (let j = 1; j < len; j++) {
                    if (!(arr[j] in maybeNums)) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    return m2[i][1];
                }
            }
        }
    }
    // we have not seen this input before
    // create arrow function that performs the desired operation
    let f;
    if (len <= 2) {
        if (len == 1) {
            f = _autoAlignArrayAverage1_4(arr);
        }
        else {
            f = _autoAlignArrayAverage2_4(arr);
        }
    }
    else {
        if (len == 3) {
            f = _autoAlignArrayAverage3_4(arr);
        }
        else {
            f = _autoAlignArrayAverage_4(arr);
        }
    }
    // cache the result
    let m1;
    if (arr[0].nodeNum in _autoAlignComp_4.memory) {
        m1 = _autoAlignComp_4.memory[arr[0].nodeNum];
    }
    else {
        m1 = {};
        _autoAlignComp_4.memory[arr[0].nodeNum] = m1;
    }
    let m2;
    if (len in m1) {
        m2 = m1[len];
    }
    else {
        m2 = [];
        m1[len] = m2;
    }
    let keys = {};
    for (let i = 0; i < arr.length; i++) {
        keys[arr[i].nodeNum] = null;
    }
    m2.push([keys,f]);
    // return the result
    return f;
}

function _autoAlignComp_2(arr,len) {
    // unlike _autoAlignComp_4
    // this function is not cached
    // because it is unlikely to recieve the same input twice
    if (len <= 2) {
        if (len == 1) {
            return _autoAlignArrayAverage1_2(arr);
        }
        else {
            return _autoAlignArrayAverage2_2(arr);
        }
    }
    else {
        if (len == 3) {
            return _autoAlignArrayAverage3_2(arr);
        }
        else {
            return _autoAlignArrayAverage_2(arr);
        }
    }
}

// autoAlignComp takes a node (box or point)
// and returns an parameterless arrow function
// the arrow function returns the ideal location of the node
// based on the positions of other nodes

function _autoAlignComp(n) {
    var f = [];
    var len;
    // for each of, above, below, partners
    // create an anonymous function that computes that average
    // divided by the weight of that attribute
    len = n.above.length;
    if (len != 0) {
        f.push( _autoAlignComp_4(n.above,len) );
    }
    else {
        f.push(() => {
            return n.c / 4.0;
        });
    }
    len = n.below.length;
    if (len != 0) {
        f.push( _autoAlignComp_4(n.below,len) );
    }
    else {
        f.push(() => {
            return n.c / 4.0;
        });
    }
    len = n.partners.length;
    if (len != 0) {
        f.push( _autoAlignComp_2(n.partners,len) );
    }
    else {
        f.push(() => {
            return n.c / 2.0;
        });
    }
    // now combine the three functions in a meaningful way
    const a = f[0];
    const b = f[1];
    const c = f[2];
    if (n.above.length < 4) {
        if (n.below.length < 4) {
            return (prevRow) => {
                return a() + b() + c();
            };
        }
        else {
            return (prevRow) => {
                return a() + b(prevRow) + c();
            };
        }
    }
    else {
        if (n.below.length < 4) {
            return (prevRow) => {
                return a(prevRow) + b() + c();
            };
        }
        else {
            return (prevRow) => {
                return a(prevRow) + b(prevRow) + c();
            };
        }
    }
}

// AutoAlignNode holds information about the position of
// a particular box or point element
// it maintains a reference to the underlying RowElement
// and keeps track of the node which influence its own position

class AutoAlignNode {
    constructor(info) {
        Check.dictionary(info);
        this.c = 0;
        this.elem = Extract.objectTypeHard(info,"elem",RowElement);
        if (this.elem instanceof BoxElement) {
            this.buffer = 2.5;
        }
        else {
            this.buffer = 0.5;
        }
        this.above = Extract.array(info,"above",[]);
        for (let i = 0; i < this.above.length; i++) {
            Check.nonnegativeInt(this.above[i]);
        }
        this.below = Extract.array(info,"below",[]);
        for (let i = 0; i < this.below.length; i++) {
            Check.nonnegativeInt(this.below[i]);
        }
        this.partners = Extract.array(info,"partners",[]);
        for (let i = 0; i < this.partners.length; i++) {
            Check.nonnegativeInt(this.partners[i]);
        }
    }
    _copyToRight(shiftAbove,shiftHere,shiftBelow) {
        // returns a copy of this instance
        // the indicies of the above, below, and partners are shifted
        // up by specified values
        // used when merging two trees
        if (shiftAbove == 0) {
            if (shiftHere == 0) {
                if (shiftBelow == 0) {
                    return this;
                }
            }
        }
        var a = [];
        for (let i = 0; i < this.above.length; i++) {
            a.push(this.above[i] + shiftAbove);
        }
        var b = [];
        for (let i = 0; i < this.below.length; i++) {
            b.push(this.below[i] + shiftBelow)
        }
        var p = [];
        for (let i = 0; i < this.partners.length; i++) {
            p.push(this.partners[i] + shiftHere);
        }
        return new AutoAlignNode({
            "elem": this.elem,
            "above": a,
            "below": b,
            "partners": p
        });
    }
}

// AutoAlignManager is a big class which deals with horizontal alignment
// the constructor parameter is list(list(AutoAlignNode))
// validates input in multiple ways before running

class AutoAlignManager {
    constructor(data) {
        var nodeNum = 1;
        Check.array(data);
        for (let i = 0; i < data.length; i++) {
            Check.array(data[i]);
            for (let j = 0; j < data[i].length; j++) {
                Check.objectType(data[i][j],AutoAlignNode);
                data[i][j].nodeNum = nodeNum;
                nodeNum++;
            }
        }
        this.data = data;
        this.verifyPairs();
        this.replaceArrays();
        this.initalOffsets();
        _autoAlignComp_4.memory = {};
        this.compFuncs();
        delete _autoAlignComp_4.memory;
    }
    verifyPairs() {
        // make sure that every reference has a symmetric reference
        for (let i = 0; i < this.data.length; i++) {
            for (let j = 0; j < this.data[i].length; j++) {
                this._verifyPairsElem(i,j);
            }
        }
    }
    _verifyPairsElem(i,j) {
        var elem = this.data[i][j];
        if (i != 0) {
            this._verifyPairsHelper(j,elem.above,this.data[i-1],"below");
        }
        if (i != this.data.length-1) {
            this._verifyPairsHelper(j,elem.below,this.data[i+1],"above");
        }
        this._verifyPairsHelper(j,elem.partners,this.data[i],"partners");
    }
    _verifyPairsHelper(n,varr,elems,param) {
        // n is the index of this element
        // varr is an array of indicies
        // elems is an array of AutoAlignNode
        // we want that every element specified by varr
        // has exactly one corresponding reference to this element n
        for (let i = 0; i < varr.length; i++) {
            let v = varr[i];
            if (v >= elems.length) {
                exceptionMemo("Value Error");
            }
            if (this._verifyPairsCount(n,elems[v][param]) != 1) {
                exceptionMemo("Value Error");
            }
        }
    }
    _verifyPairsCount(n,nums) {
        var count = 0;
        for (let i = 0; i < nums.length; i++) {
            if (nums[i] == n) {
                count++;
            }
        }
        return count;
    }
    replaceArrays() {
        // replace numberical references to nodes
        // with javascript references to those same nodes
        // this is a simple replacement operation
        for (let i = 0; i < this.data.length; i++) {
            for (let j = 0; j < this.data[i].length; j++) {
                this._replaceArrays_above(i,j);
                this._replaceArrays_below(i,j);
                this._replaceArrays_partners(i,j);
            }
        }
    }
    _replaceArrays_above(i,j) {
        let elem = this.data[i][j];
        if (i == 0) {
            elem.above = [];
            return;
        }
        for (let k = 0; k < elem.above.length; k++) {
            let v = elem.above[k];
            if (v >= this.data[i-1].length) {
                exceptionMemo("Value Error");
            }
            elem.above[k] = Check.objectType(this.data[i-1][v],AutoAlignNode);
        }
    }
    _replaceArrays_below(i,j) {
        let elem = this.data[i][j];
        if (i == this.data.length - 1) {
            elem.below = [];
            return;
        }
        for (let k = 0; k < elem.below.length; k++) {
            let v = elem.below[k];
            if (v >= this.data[i+1].length) {
                exceptionMemo("Value Error");
            }
            elem.below[k] = Check.objectType(this.data[i+1][v],AutoAlignNode);
        }
    }
    _replaceArrays_partners(i,j) {
        let elem = this.data[i][j];
        for (let k = 0; k < elem.partners.length; k++) {
            let v = elem.partners[k];
            if (v >= this.data[i].length) {
                exceptionMemo("Value Error");
            }
            if (v == j) {
                exceptionMemo("Value Error");
            }
            elem.partners[k] = Check.objectType(this.data[i][v],AutoAlignNode);
        }
    }
    initalOffsets() {
        // left justify all elements
        for (let i = 0; i < this.data.length; i++) {
            this._initialOffsetRow(this.data[i]);
        }
    }
    _initialOffsetRow(row) {
        var spot = 0;
        for (let i = 0; true; i++) {
            row[i].c = Check.nonnegative(spot);
            if (i == row.length - 1) {
                break;
            }
            spot += row[i].buffer;
            spot += row[i+1].buffer;
        }
    }
    compFuncs() {
        // for each node, attach a parameterless arrow function which
        // will return the ideal location of that node
        for (let i = 0; i < this.data.length; i++) {
            for (let j = 0; j < this.data[i].length; j++) {
                let elem = this.data[i][j];
                elem.comp = _autoAlignComp(elem);
            }
        }
    }
    run() {
        var data = this.data;
        var dl = data.length;
        var flag = false;
        var shiftFactor = (this.data.length / 102) * 2048;
        shiftFactor = Math.max(shiftFactor,1.0);
        // shiftFactor decides when the loop stops
        // it is related to the maximum distance that two nodes can be misaligned
        // more generations means greater shiftFactor
        // the shiftFactor is chosen such that the maximum misalignment from the top
        // generation to the bottom is always smaller than one pixel
        this.prevRow = -1;
        while (true) {
            let shift = 0;
            for (let i = 1; i < dl; i++) {
                // iterate from first generation to last
                // updating positions to bring them closer to ideal
                let res = AutoAlignManager._runRow(data[i]);
                shift = Math.max(shift,res);
                this.prevRow = i;
            }
            for (let i = dl - 2; i >= 0; i--) {
                // iterate from last generation to first
                // updating positions to bring them closer to ideal
                let res = AutoAlignManager._runRow(data[i]);
                shift = Math.max(shift,res);
                this.prevRow = i;
            }
            // if we reach the exit condition on two consecutive iterations
            // then we leave the loop
            // this decreases the liklihood of exiting prematurely
            shift *= shiftFactor;
            if (shift < 0.001) {
                if (flag) {
                    break;
                }
                else {
                    flag = true;
                }
            }
            else {
                flag = false;
            }
        }
        this.setRightOf();
    }
    static _runRow(row) {
        // iterate through a row
        // updating positions to bring them closer to ideal
        var rl = row.length;
        var topIndex = rl - 1;
        for (let i = 0; i < rl; i++) {
            // reset each node in this row
            // then use the difference between the location and the
            // ideal location to compute the "force" exerted on the node
            let elem = row[i];
            elem.t = elem.c;
            elem.force = elem.comp(this.prevRow) - elem.t;
            elem.boxes = 1;
        }
        for (let i = topIndex; i >= 0; i--) {
            // determine new location based on the forces of the elements in this row
            AutoAlignManager._runBox(row,i,topIndex);
        }
        var shift = 0;
        for (let i = 0; i < row.length; i++) {
            // set location to be the new location
            // keeping track of how far each element moves
            let elem = row[i];
            let res = elem.t - elem.c;
            shift = Math.max(shift,res);
            elem.c = elem.t;
        }
        // return the greatest difference between old location
        // and new location
        return shift;
    }
    static _runBox(row,i,topIndex) {
        // try to move this box closer to its ideal location
        // if there are other elements in the way, try pushing them
        var r = i;
        while (row[r].force > 0) {
            if (r == topIndex) {
                let forceMove = row[r].force / row[r].boxes
                for (let s = i; s <= r; s++) {
                    row[s].t += forceMove;
                }
                row[r].force = 0;
                return;
            }
            let spaceMove = (row[r+1].t - row[r].t) - row[r].buffer - row[r+1].buffer;
            spaceMove = Math.max(spaceMove,0);
            let forceMove = row[r].force / row[r].boxes;
            if (spaceMove >= forceMove) {
                for (let s = i; s <= r; s++) {
                    row[s].t += forceMove;
                }
                row[r].force = 0;
                return;
            }
            if (spaceMove > 0) {
                for (let s = i; s <= r; s++) {
                    row[s].t += spaceMove;
                }
            }
            row[r].force -= spaceMove * row[r].boxes;
            let s = r+1;
            let b = row[s].boxes;
            if (b < 1) {
                s = -b;
            }
            row[s].boxes += row[r].boxes;
            row[i].boxes = -s;
            row[s].force += row[r].force;
            row[r].force = 0;
            r = s;
        }
    }
    setRightOf() {
        // convert the offset positions to rightOf positions
        // for each node
        for (let i = 0; i < this.data.length; i++) {
            for (let j = 0; j < this.data[i].length; j++) {
                let elem = this.data[i][j];
                if (elem.elem instanceof BoxElement) {
                    elem.c -= 2;
                }
            }
        }
        var base = 0;
        for (let i = 0; i < this.data.length; i++) {
            let elem = this.data[i][0];
            base = Math.min(base,elem.c);
        }
        for (let i = 0; i < this.data.length; i++) {
            for (let j = 0; j < this.data[i].length; j++) {
                let elem = this.data[i][j];
                elem.c = Math.max(elem.c-base,0);
            }
        }
        for (let i = 0; i < this.data.length; i++) {
            for (let j = 0; j < 1; j++) {
                let elem = this.data[i][j];
                let delta = elem.c;
                let ro = Math.max(delta,0);
                elem.elem.rightOf = Check.nonnegative(ro);
            }
            for (let j = 1; j < this.data[i].length; j++) {
                let elem = this.data[i][j];
                let delta = elem.c - this.data[i][j-1].c;
                let w = 0;
                if (this.data[i][j-1].elem instanceof BoxElement) {
                    w = 4;
                }
                let ro = Math.max(delta-w,0);
                elem.elem.rightOf = Check.nonnegative(ro);
            }
        }
    }
}