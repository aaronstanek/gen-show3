// checkStuff.js
// low level functions for type checking

'use strict';

// Check methods
// check to see if the input is of the correct data type
// if yes, return the input
// if no, throw an exception

class Check {
    static bool(v) {
        if (typeof v != "boolean") {
            exceptionMemo("Type Error");
        }
        return v;
    }
    static number(v) {
        if (typeof v != "number") {
            exceptionMemo("Type Error");
        }
        if (isNaN(v)) {
            exceptionMemo("NaN Error");
        }
        if (v == Infinity || v == -Infinity) {
            exceptionMemo("Value Error");
        }
        return v;
    }
    static nonnegative(v) {
        Check.number(v);
        if (v < 0) {
            exceptionMemo("Value Error");
        }
        return v;
    }
    static nonnegativeInt(v) {
        if (!(Number.isInteger(v))) {
            exceptionMemo("Type Error");
        }
        if (v < 0) {
            exceptionMemo("Value Error");
        }
        return v;
    }
    static text(v) {
        if (typeof v != "string") {
            exceptionMemo("Type Error");
        }
        return v;
    }
    static array(v) {
        if (Array.isArray(v)) {
            return v;
        }
        else {
            exceptionMemo("Type Error");
        }
    }
    static nonemptyArray(v) {
        Check.array(v);
        if (v.length == 0) {
            exceptionMemo("Value Error");
        }
        return v;
    }
    static dictionary(v) {
        if (typeof v != "object") {
            exceptionMemo("Type Error");
        }
        if (Array.isArray(v)) {
            exceptionMemo("Type Error");
        }
        if (v === null) {
            exceptionMemo("Type Error");
        }
        return v;
    }
    static objectType(v,t) {
        // checks if v is an instance of t
        Check.classReference(t);
        if (v instanceof t) {
            return v;
        }
        else {
            exceptionMemo("Type Error");
        }
    }
    static classReference(v) {
        if (typeof v != "function") {
            exceptionMemo("Type Error");
        }
        return v;
    }
}

// Extract methods
// check to see if a dictionary has a key with a particular data type
// if the key is not there, return a specified fallback value
// if the key is there, but the value is of the wrong type, throw an exception
// if the key is there and the value is of the correct type, return the associated value

// Extract hard methods
// check to see if a dictionary has a key with a particular data type
// if the key is there and the value is of the correct type, return the associated value
// otherwise throw an exception

class Extract {
    static bool(info,name,fallback) {
        Check.dictionary(info);
        Check.text(name);
        if (name in info) {
            return Check.bool(info[name]);
        }
        else {
            return Check.bool(fallback);
        }
    }
    static number(info,name,fallback) {
        Check.dictionary(info);
        Check.text(name);
        if (name in info) {
            return Check.number(info[name]);
        }
        else {
            return Check.number(fallback);
        }
    }
    static nonnegative(info,name,fallback) {
        Check.dictionary(info);
        Check.text(name);
        if (name in info) {
            return Check.nonnegative(info[name]);
        }
        else {
            return Check.nonnegative(fallback);
        }
    }
    static nonnegativeHard(info,name) {
        Check.dictionary(info);
        Check.text(name);
        if (name in info) {
            return Check.nonnegative(info[name]);
        }
        else {
            exceptionMemo("Missing Key");
        }
    }
    static text(info,name,fallback) {
        Check.dictionary(info);
        Check.text(name);
        if (name in info) {
            return Check.text(info[name]);
        }
        else {
            return Check.text(fallback);
        }
    }
    static array(info,name,fallback) {
        Check.dictionary(info);
        Check.text(name);
        if (name in info) {
            return Check.array(info[name]);
        }
        else {
            return Check.array(fallback);
        }
    }
    static arrayHard(info,name) {
        Check.dictionary(info);
        Check.text(name);
        if (name in info) {
            return Check.array(info[name]);
        }
        else {
            exceptionMemo("Missing Key");
        }
    }
    static objectTypeHard(info,name,t) {
        // info[name] must be an instance of t
        Check.dictionary(info);
        Check.text(name);
        if (name in info) {
            return Check.objectType(info[name],t);
        }
        else {
            exceptionMemo("Missing Key");
        }
    }
}