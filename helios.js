var Helios;
(function (Helios) {
    var worker = new Worker('heliosWorker.js');
    worker.onmessage = function (e) {
        console.log("Received: " + JSON.stringify(e.data));
    };
    var func = function () {
        return this;
    };
    worker.postMessage(func.toString());
})(Helios || (Helios = {
}));
//@ sourceMappingURL=helios.js.map
