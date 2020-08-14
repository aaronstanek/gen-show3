// exceptionMemo.js
// low level exception throwing

'use strict';

function exceptionMemo(memo) {
    // put a memo on the console
    // and then alert it
    // and then throw it
    Check.text(memo);
    console.log(memo);
    alert("Exception: "+memo);
    throw memo;
}