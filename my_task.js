// your custom PRIVATE functions
 
function myPrivateFunc1 () {
  // do something
}
 
function myPrivateFunc2 () {
  // do something
}
 
// etc. etc.
 
// your custom PUBLIC functions (i.e. queryable from the main page)
 
var queryableFunctions = {
  // example #1: get the difference between two numbers:
  getDifference: function (nMinuend, nSubtrahend) {
      reply("printSomething", nMinuend - nSubtrahend);
  },
  // example #2: wait three seconds
  waitSomething: function () {
      setTimeout(function() { reply("alertSomething", 3, "seconds"); }, 3000);
  }
};
 
// system functions
 
function defaultQuery (vMsg) {
  // your default PUBLIC function executed only when main page calls the queryableWorker.postMessage() method directly
  // do something
}
 
function reply (/* listener name, argument to pass 1, argument to pass 2, etc. etc */) {
  if (arguments.length < 1) { 
    throw new TypeError("reply - not enough arguments"); 
    return; 
  }
  postMessage({ "vo42t30": arguments[0], "rnb93qh": Array.prototype.slice.call(arguments, 1) });
}
 
onmessage = function (oEvent) {
  if (oEvent.data instanceof Object && oEvent.data.hasOwnProperty("bk4e1h0") && oEvent.data.hasOwnProperty("ktp3fm1")) {
    queryableFunctions[oEvent.data.bk4e1h0].apply(self, oEvent.data.ktp3fm1);
  } else {
    defaultQuery(oEvent.data);
  }
};
