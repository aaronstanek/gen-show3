// autoAlign.js
// mid level functions and classes for horizontal placement of boxes and points

'use strict';

// this algorithm attaches springs between connected
// nodes, it evolves the system forward in time with
// a drag proportional to the velocity
// loop terminates when an equilibirum state is reached

// AutoAlignNode holds information about the position of
// a particular box or point element
// it maintains a reference to the underlying RowElement
// and keeps track of the node which influence its own position

class AutoAlignNode {
    constructor(info) {
        Check.dictionary(info);
        this.c = 0;
        this.velocity = 0;
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
    updateAV(max_v) {
        // updates acceleration and velocity of a node
        let a = 0;
        for (let i = 0; i < this.above.length; i++) {
            a += this.above[i].c - this.c;
        }
        for (let i = 0; i < this.below.length; i++) {
            a += this.below[i].c - this.c;
        }
        for (let i = 0; i < this.partners.length; i++) {
            a += (this.partners[i].c - this.c) * 10;
        }
        let acceleration_limit = Math.max(1.2*Math.abs(this.velocity),10);
        // don't accelerate too quickly
        let acceleration = a / 1000;
        this.velocity += acceleration;
        this.velocity *= 0.99;
        // add some drag
        this.velocity = Math.min(this.velocity,max_v);
        this.velocity = Math.max(this.velocity,-max_v);
        // implement a "speed of light" limit
        this.rem = this.velocity;
        // this is how far we have
        // to move this node during this round
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
    run() {
        // implement a physical simulation with
        // damped coupled harmonic oscillators
        // use equilibrium state to place nodes on the page
        var shiftFactor = (this.data.length / 102) * 2048;
        shiftFactor = Math.max(shiftFactor,1.0);
        // shiftFactor decides when the loop stops
        // it is related to the maximum distance that two nodes can be misaligned
        // more generations means greater shiftFactor
        // the shiftFactor is chosen such that the maximum misalignment from the top
        // generation to the bottom is always smaller than one pixel
        var win_count = 0;
        var loss_count = 0;
        var smallest_shift_yet = -1;
        var max_v = 1000; // "speed of light"
        while (true) {
            // update velocity for each node and
            // record where it is right now
            for (let j = 0; j < this.data.length; j++) {
                for (let k = 0; k < this.data[j].length; k++) {
                    this.data[j][k].updateAV(max_v);
                    this.data[j][k].savePoint = this.data[j][k].c;
                }
            }
            this._resolve_rem(); // move all the nodes
            // now determine the greatest distance
            // that any of the nodes moved
            let shift = 0;
            for (let j = 0; j < this.data.length; j++) {
                for (let k = 0; k < this.data[j].length; k++) {
                    let delta = Math.abs(this.data[j][k].savePoint-this.data[j][k].c);
                    shift = Math.max(shift,delta);
                }
            }
            shift *= shiftFactor;
            if (shift > 0.001) {
                // if the maximum shift is above threshold
                // then reset counter
                // we want 100 rounds below threshold to be sure that
                // we have really reached an equilibirum state
                win_count = 0;
            }
            else {
                // if the maximum shift is below threshold
                // then mark this as a potential exit condition
                win_count += 1;
                if (win_count >= 100) {
                    // exit condition
                    break;
                }
            }
            if (smallest_shift_yet == -1) {
                smallest_shift_yet = shift;
            }
            else if (shift < smallest_shift_yet) {
                smallest_shift_yet = shift;
                loss_count = 0;
            }
            else {
                loss_count += 1;
                if (loss_count >= 100) {
                    // if we go 100 rounds without seeing
                    // a smaller shift, we may need to lower the
                    // speed of light to artificially constrain
                    // the system
                    max_v *= 0.9;
                    loss_count = 0;
                }
            }
        }
        this._compactify();
        this.setRightOf();
    }
    _resolve_rem() {
        // shift all the nodes such that rem = 0
        for (let rowNum = 0; rowNum < this.data.length; rowNum++) {
            let row = this.data[rowNum];
            // min_x and max_x form a range
            // the nodes in the range will be moved as a block
            let min_x = -1;
            let max_x = -1;
            let total_rem = 0;
            while (true) {
                if (total_rem <= 1e-6) {
                    // if the rem of the block is near zero
                    // then we should move to the next block
                    min_x = max_x + 1;
                    max_x = min_x;
                    if (min_x >= row.length) {
                        break;
                    }
                    total_rem = row[min_x].rem;
                    row[min_x].rem = 0;
                    continue;
                }
                // total_rem is not zero
                // how far can we move in the desired direciton?
                let can_move = 0;
                if (total_rem > 0) {
                    if (max_x == row.length - 1) {
                        can_move = total_rem + 1;
                    }
                    else {
                        can_move = (row[max_x+1].c - row[max_x].c) - row[max_x+1].buffer - row[max_x].buffer;
                    }
                }
                else {
                    if (min_x == 0) {
                        can_move = Math.abs(total_rem) + 1;
                    }
                    else {
                        can_move = (row[min_x].c - row[min_x-1].c) - row[min_x].buffer - row[min_x-1].buffer;
                    }
                }
                // can_move is nonnegative
                if (can_move <= 1e-6) {
                    // total_rem is not zero
                    // but can move is, we are against another node
                    // extend the block to include that node
                    if (total_rem > 0) {
                        max_x += 1;
                        total_rem += row[max_x].rem;
                        row[max_x].rem = 0;
                    }
                    else {
                        min_x -= 1;
                        total_rem += row[min_x].rem;
                        row[min_x].rem = 0;
                    }
                    continue;
                }
                // we are going to move some nodes
                // divide total_rem by the number of nodes in the block
                let move_each = total_rem / (max_x - min_x + 1);
                if (Math.abs(move_each) > can_move) {
                    // the distance we want to move is greater
                    // than the distance to the nearest block
                    if (total_rem > 0) {
                        move_each = can_move;
                    }
                    else {
                        move_each = -can_move;
                    }
                }
                total_rem -= can_move * (max_x - min_x + 1);
                for (let i = min_x; i <= max_x; i++) {
                    row[i].c += move_each;
                }
            }
        }
    }
    _compactify() {
        // move nodes without any attachment
        // inwards
        for (let rowNum = 0; rowNum < this.data.length; rowNum++) {
            let row = this.data[rowNum];
            // left_anchor and right_anchor
            // are the lestmost and right most nodes in this row
            // that have at least one attachment
            let left_anchor = -1;
            let right_anchor = -1;
            for (let i = 0; i < row.length; i++) {
                let elem = row[i];
                if (elem.above.length + elem.below.length + elem.partners.length != 0) {
                    if (left_anchor == -1) {
                        left_anchor = i;
                    }
                    right_anchor = i;
                }
            }
            if (left_anchor == -1) {
                left_anchor = 0;
                right_anchor = 0;
            }
            // left_anchor and right_anchor are now set
            // move free floating nodes
            for (let i = left_anchor - 1; i >= 0; i--) {
                let elem = row[i];
                if (elem.above.length + elem.below.length + elem.partners.length == 0) {
                    // there is always a node to the right
                    elem.c = row[i+1].c - row[i+1].buffer - elem.buffer;
                }
            }
            for (let i = right_anchor + 1; i < row.length; i++) {
                let elem = row[i];
                if (elem.above.length + elem.below.length + elem.partners.length == 0) {
                    // there is always a node to the left
                    elem.c = row[i-1].c + row[i-1].buffer + elem.buffer;
                }
            }
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
            if (i == 0) {
                base = elem.c;
            }
            else {
                base = Math.min(base,elem.c);
            }
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