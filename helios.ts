/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 20/02/13
 * Time: 9:57 AM
 * To change this template use File | Settings | File Templates.
 */

var Helios;
(function (Helios) {
    var worker = new Worker('heliosWorker.js');
    worker.onmessage = function(e) {
        console.log("Received: " + JSON.stringify(e.data));
    }
    var func = function(){return this;};
    worker.postMessage(func.toString()); // Start the worker.
})(Helios || (Helios = {}));