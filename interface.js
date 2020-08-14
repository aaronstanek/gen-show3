// interface.js
// high level interface classes for user input

'use strict';

class GS3_Generation {
    // a generation of people
    constructor() {
        this.elements = [];
        this.lines = [];
        this.aans = []; // AutoAlignNode objects
    }
    _mergeFromLeft(other) {
        // used to add generations from the left side of a merge
        // other is the left tree
        this.elements = this.elements.concat(other.elements);
        this.lines = this.lines.concat(other.lines);
        this.aans = this.aans.concat(other.aans);
    }
    _mergeFromRightHelper(spotToRight,i) {
        // spotToRight is an arrray
        // this function returns spotToRight[i] is if exists
        // 0 otherwise
        if (i < 0) {
            return 0;
        }
        if (i > spotToRight.length-1) {
            return 0;
        }
        return spotToRight[i];
    }
    _mergeFromRight(other,spotToRight,i) {
        // used to add generations from the right side of a merge
        // other is the right tree
        // spotToRight is an array specifying how many elements were
        // part of each generation before the right tree was incorporated
        this.elements = this.elements.concat(other.elements);
        this.lines = this.lines.concat(other.lines);
        var shiftAbove = this._mergeFromRightHelper(spotToRight,i-1);
        // how much the generation before was shifted to the right
        var shiftHere = this._mergeFromRightHelper(spotToRight,i);
        // how much this generation was shifted to the right
        var shiftBelow = this._mergeFromRightHelper(spotToRight,i+1);
        // how much the generation after was shifted to the right
        for (let i = 0; i < other.aans.length; i++) {
            this.aans.push( other.aans[i]._copyToRight(shiftAbove,shiftHere,shiftBelow) );
        }
    }
}

class FamilyTree {
    // a family tree
    constructor() {
        this.gens = []; // GS3_Generation objects
        this.table = {};
        // str -> [int,int]
        // where the key is the id of a person
        // the value is a generation number / position in generation pair
        this.activeGeneration = 0;
        // the generation currently being edited
        this.queueStatus = 0;
        // 0 means that this object is accepting input
        // 1 means that this object has been merged and cannot accept input
        // 2 means that this object has been queued for render and cannot accept input
    }
    _lookup(id) {
        // returns the position of a rowElement in the layout
        Check.text(id);
        var output = this.table[id];
        if (typeof output == "undefined") {
            exceptionMemo("id \""+id+"\" is used but not defined");
        }
        return output;
    }
    _checkUniqueId(id) {
        // ensures that a given id does not match any known id
        if (id in this.table) {
            exceptionMemo("id \""+id+"\" is defined multiple times");
        }
    }
    _addToTable(t) {
        // copies an auxiliary id table into
        // this FamilyTree's id table
        // checks for duplicates
        var keys = Object.keys(t);
        for (let i = 0; i < keys.length; i++) {
            this._checkUniqueId(keys[i]);
            this.table[keys[i]] = t[keys[i]];
        }
    }
    merge(other,hereName,otherName) {
        // merges this FamilyTree with another FamilyTree
        // returns a merged copy
        // the input trees become unusable
        // hereName and otherName are ids
        // the generations of the input trees will be aligned such that
        // the elements specified by the ids are on the same generation
        // the tree given as an argument will be on the right side of the
        // merged tree
        if (this.queueStatus != 0 || other.queueStatus != 0) {
            exceptionMemo("merge called on a tree that has already been merged or has been queued for render");
        }
        Check.objectType(other,FamilyTree);
        if (this === other) {
            exceptionMemo("cannot merge a tree with itself");
        }
        Check.text(hereName);
        Check.text(otherName);
        var thisSpot = this._lookup(hereName);
        var otherSpot = other._lookup(otherName);
        var thisShift = 0;
        var otherShift = 0;
        if (thisSpot[0] != otherSpot[0]) {
            if (thisSpot[0] > otherSpot[0]) {
                otherShift = thisSpot[0] - otherSpot[0];
            }
            else {
                thisShift = otherSpot[0] - thisSpot[0];
            }
        }
        var output = new FamilyTree();
        for (let i = 0; i < this.gens.length; i++) {
            let genNum = i + thisShift;
            while (output.gens.length-1 < genNum) {
                output.gens.push(new GS3_Generation());
            }
            output.gens[genNum]._mergeFromLeft(this.gens[i]);
        }
        var spotToRight = [];
        for (let i = 0; i < other.gens.length; i++) {
            let genNum = i + otherShift;
            while (output.gens.length-1 < genNum) {
                output.gens.push(new GS3_Generation());
            }
            spotToRight.push(output.gens[genNum].elements.length);
        }
        for (let i = 0; i < other.gens.length; i++) {
            let genNum = i + otherShift;
            output.gens[genNum]._mergeFromRight(other.gens[i],spotToRight,i);
        }
        var keys;
        var tabLeft = {};
        var tabRight = {};
        keys = Object.keys(this.table);
        for (let i = 0; i < keys.length; i++) {
            let spot = this.table[keys[i]];
            let updatedSpot = [spot[0]+thisShift,spot[1]];
            tabLeft[keys[i]] = updatedSpot;
        }
        keys = Object.keys(other.table);
        for (let i = 0; i < keys.length; i++) {
            let spot = other.table[keys[i]];
            let updatedSpot = [spot[0]+otherShift,spot[1]+spotToRight[spot[0]]];
            tabRight[keys[i]] = updatedSpot;
        }
        output._addToTable(tabRight);
        output._addToTable(tabLeft);
        output.activeGeneration = 0;
        this.queueStatus = 1;
        other.queueStatus = 1;
        return output;
    }
    mergeSequential(other) {
        // similar to the merge function
        // except the tree given as an argument is placed
        // after the other tree
        if (this.queueStatus != 0 || other.queueStatus != 0) {
            exceptionMemo("mergeSequential called on a tree that has already been merged or has been queued for render");
        }
        Check.objectType(other,FamilyTree);
        if (this === other) {
            exceptionMemo("cannot merge a tree with itself");
        }
        var output = new FamilyTree();
        output.gens = this.gens.concat(other.gens);
        var tabRight = {};
        var keys = Object.keys(other.table);
        var otherShift = this.gens.length;
        for (let i = 0; i < keys.length; i++) {
            let spot = other.table[keys[i]];
            let updatedSpot = [spot[0] + otherShift,spot[1]];
            tabRight[keys[i]] = updatedSpot;
        }
        output._addToTable(tabRight);
        output._addToTable(this.table);
        output.activeGeneration = 0;
        this.queueStatus = 1;
        other.queueStatus = 1;
        return output;
    }
    setActiveGeneration(g) {
        // sets the active generation
        // the argument is an id
        // or one of the following strings
        // #before (active generation is set before the earliest generation)
        // #first (active generation is set to the earliest generation)
        // #last (active generation is set to the last generation)
        // #after (active generation is set to the generation after the last defined)
        // using #before and #after will cause a new generation to be created when the first rowElement is added
        // #before will cause renumbering of all existing generations, making this operation potentially expensive
        if (this.queueStatus != 0) {
            exceptionMemo("setActiveGeneration called on a tree that has been merged or has been queued for render");
        }
        Check.text(g);
        if (g == "#before") {
            this.activeGeneration = -1;
            return;
        }
        if (g == "#first") {
            this.activeGeneration = 0;
            return;
        }
        if (g == "#last") {
            this.activeGeneration = Math.max(this.gens.length-1,0);
            return;
        }
        if (g == "#after") {
            this.activeGeneration = this.gens.length;
            return;
        }
        var spot = this._lookup(g);
        this.activeGeneration = spot[0];
    }
    _addGenerationBefore() {
        // creates a new generation before all existing ones
        // renumbers other generations
        // updates id table accordingly
        // updates activeGeneration accordingly
        this.gens = ([new GS3_Generation()]).concat(this.gens);
        var keys = Object.keys(this.table);
        for (let i = 0; i < keys.length; i++) {
            let spot = this.table[keys[i]];
            let updatedSpot = [spot[0]+1,spot[1]];
            this.table[keys[i]] = updatedSpot;
        }
        this.activeGeneration += 1;
    }
    _adjustForActiveGeneration() {
        // if activeGeneration is outside the bounds of
        // the gens array, this function will add GS3_Generation
        // objects such that gens[activeGeneration] is defined
        while (this.activeGeneration < 0) {
            this._addGenerationBefore();
        }
        while (this.activeGeneration > this.gens.length-1) {
            this.gens.push(new GS3_Generation());
        }
    }
    checkID(id) {
        // ensures that a given variable is a valid id
        // does not check uniqueness
        Check.text(id);
        if (id.length < 1) {
            exceptionMemo("id must have nonzero length");
        }
        if (id.slice(0,1) == "#") {
            exceptionMemo("id cannot start with #");
        }
    }
    addPerson(id,info) {
        // adds a person to the tree
        if (this.queueStatus != 0) {
            exceptionMemo("addPerson called on a tree that has been merged or has been queued for render");
        }
        this.checkID(id);
        this._checkUniqueId(id);
        Check.dictionary(info);
        this._adjustForActiveGeneration();
        var elem = new BoxElement(info);
        var gen = this.gens[this.activeGeneration];
        this.table[id] = [this.activeGeneration,gen.elements.length];
        gen.elements.push(elem);
        gen.aans.push(new AutoAlignNode({"elem":elem}));
    }
    addPoint(id) {
        // adds a point to the tree
        if (this.queueStatus != 0) {
            exceptionMemo("addPoint called on a tree that has been merged or has been queued for render");
        }
        this.checkID(id);
        this._checkUniqueId(id);
        this._adjustForActiveGeneration();
        var elem = new PointElement({});
        var gen = this.gens[this.activeGeneration];
        this.table[id] = [this.activeGeneration,gen.elements.length];
        gen.elements.push(elem);
        gen.aans.push(new AutoAlignNode({"elem":elem}));
    }
    _getSpotsFromArray(arr) {
        // converts an array of ids
        // into an array of locations
        Check.array(arr);
        var output = [];
        for (let i = 0; i < arr.length; i++) {
            this.checkID(arr[i]);
            output.push(this._lookup(arr[i]));
        }
        return output;
    }
    _getElementsFromArray(arr) {
        // converts an array of locations
        // into an array of rowElement
        var output = [];
        for (let i = 0; i < arr.length; i++) {
            let spot = arr[i];
            let elem = this.gens[spot[0]].elements[spot[1]];
            output.push(elem);
        }
        return output;
    }
    _addAboveBelow(parentsSpots,childSpots) {
        // makes AutoAlignNodes aware of parent-child relationships
        var parentsGen = this.gens[parentsSpots[0][0]];
        var childGen = this.gens[childSpots[0][0]];
        for (let i = 0; i < parentsSpots.length; i++) {
            let parentIndex = parentsSpots[i][1];
            for (let j = 0; j < childSpots.length; j++) {
                let childIndex = childSpots[j][1];
                childGen.aans[childIndex].above.push(parentIndex);
                parentsGen.aans[parentIndex].below.push(childIndex);
            }
        }
    }
    _addPartners(parentsSpots) {
        // makes AutoAlignNodes aware of parent-parent relationships
        var parentsGen = this.gens[parentsSpots[0][0]];
        var index1 = parentsSpots[0][1];
        var index2 = parentsSpots[1][1];
        if (index1 == index2) {
            exceptionMemo("addLines3 called with duplicate parents");
        }
        parentsGen.aans[index1].partners.push(index2);
        parentsGen.aans[index2].partners.push(index1);
    }
    _addLinesAll(parents,children,info,MetaLineClass,classNum) {
        // adds lines to a tree
        var parentsSpots = this._getSpotsFromArray(parents);
        var childSpots = this._getSpotsFromArray(children);
        if (classNum != 3) {
            if (parentsSpots.length < 1 || childSpots.length < 1) {
                exceptionMemo("addLines expects both the parents array and children array to have nonzero length");
            }
        }
        else {
            if (parentsSpots.length < 1) {
                exceptionMemo("addLines expects the parents array to have nonzero length");
            }
        }
        var parentsGeneration = parentsSpots[0][0];
        for (let i = 1; i < parentsSpots.length; i++) {
            if (parentsSpots[i][0] != parentsGeneration) {
                exceptionMemo("addLines expects all parents to be of the same generation");
            }
        }
        for (let i = 0; i < childSpots.length; i++) {
            if (childSpots[i][0] != parentsGeneration+1) {
                exceptionMemo("addLines expects all children to be one generation after the parents");
            }
        }
        var parentsElems = this._getElementsFromArray(parentsSpots);
        var childElems = this._getElementsFromArray(childSpots);
        this.gens[parentsGeneration].lines.push( new MetaLineClass(parentsElems,childElems,info) );
        if (childSpots.length != 0) {
            this._addAboveBelow(parentsSpots,childSpots);
        }
        if (classNum == 3) {
            this._addPartners(parentsSpots);
        }
    }
    addLines1(parents,children,info={}) {
        if (this.queueStatus != 0) {
            exceptionMemo("addLines1 called on a tree that has been merged or has been queued for render");
        }
        this._addLinesAll(parents,children,info,MetaLine1,1);
    }
    addLines2(parents,children,info={}) {
        if (this.queueStatus != 0) {
            exceptionMemo("addLines2 called on a tree that has been merged or has been queued for render");
        }
        this._addLinesAll(parents,children,info,MetaLine2,2);
    }
    addLines3(parents,children,info={}) {
        if (this.queueStatus != 0) {
            exceptionMemo("addLines3 called on a tree that has been merged or has been queued for render");
        }
        this._addLinesAll(parents,children,info,MetaLine3,3);
    }
    queueRender() {
        // queues a tree for render
        // render occurs after current thread has terminated
        if (FamilyTree._queueRenderCallCount != 0) {
            exceptionMemo("queueRender called multiple times in the same program");
        }
        else {
            FamilyTree._queueRenderCallCount = 1;
        }
        if (this.queueStatus == 1) {
            exceptionMemo("queueRender called on a tree that has been merged");
        }
        if (this.queueStatus != 0) {
            return;
        }
        this.queueStatus = 2;
        setTimeout(_FamilyTreeLaunchRender,0,this);
    }
}

FamilyTree._queueRenderCallCount = 0;

function _FamilyTreeLaunchRender(tree) {
    Check.objectType(tree,FamilyTree);
    var aans = [];
    for (let i = 0; i < tree.gens.length; i++) {
        aans.push(tree.gens[i].aans);
    }
    var aa = new AutoAlignManager(aans);
    aa.run();
    var boxes = new BoxRowCollection();
    var h = [];
    var v = [];
    for (let i = 0; i < tree.gens.length; i++) {
        let gen = tree.gens[i];
        let row = new BoxRow({});
        let hc = new HorizontalLineCollection();
        let vc = new VerticalLineCollection();
        for (let j = 0; j < gen.elements.length; j++) {
            row.addElem(gen.elements[j]);
        }
        for (let j = 0; j < gen.lines.length; j++) {
            gen.lines[j].addLines(hc,vc);
        }
        boxes.addRow(row);
        h.push(hc);
        v.push(vc);
    }
    var rm = new RenderManager(boxes,h,v);
    rm.runX();
    rm.runY();
}
