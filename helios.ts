
module Helios {
    //var worker = new Worker('heliosWorker.js');
    
    // var func = function(){return this;};
    // worker.postMessage(func.toString()); // Start the worker.

    declare var Q;
    declare var UUID;


    export class Graph {
    	worker;
    	constructor(){
    		this.worker = new SharedWorker('heliosWorker.js');
    		this.worker.port.onmessage = (e) => {
				console.log(e.data);
			};
			//this.worker.port.start();
			// post a message to the shared web worker
			this.worker.port.postMessage({method:'init'});
    		// this.worker.port.postMessage({method:'init'})
    		// 	.then(function(val){console.log(val)});
		}

		setConfiguration(options:{}):void{
			this.worker.port.postMessage([{method:'setConfiguration', parameters:[options]}])
				//.then(function(val){console.log(val)});
			//return this;
		}

//        setPathEnabled(turnOn:bool):bool {
//        	this.worker.postMessage([{method:'setPathEnabled', parameters:[turnOn]}])
// 				.then(function(val){console.log(val)});
//           return this.pathEnabled = turnOn;
//        }

// //need to look at this
//        getPathEnabled():bool {
//            return this.pathEnabled;
//        }

		createVIndex(idxName:string):void {
            this.worker.port.postMessage([{method:'createVIndex', parameters:[idxName]}])
				//.then(function(val){console.log(val)});
			//return this;
        }

        createEIndex(idxName:string):void {
            this.worker.port.postMessage([{method:'createEIndex', parameters:[idxName]}])
				//.then(function(val){console.log(val)});
			//return this;
        }

        deleteVIndex(idxName:string):void {
            this.worker.port.postMessage([{method:'deleteVIndex', parameters:[idxName]}])
				//.then(function(val){console.log(val)});
        }

        deleteEIndex(idxName:string):void {
            this.worker.port.postMessage([{method:'deleteEIndex', parameters:[idxName]}])
				//.then(function(val){console.log(val)});
        }

		loadGraphSON(jsonData:string):Graph{
			this.worker.port.postMessage([{method:'loadGraphSON', parameters:[jsonData]}])
				//.then(function(val){console.log(val)});
			return this;
		}

		loadGraphML(xmlData:string):Graph{
			//var deferred = Q.defer();
			this.worker.port.postMessage({message:[{method:'loadGraphML', parameters:[xmlData]}]})
				//.then(function(val){console.log(val)});

			// this.worker.onmessage = function(e) {
			// 	deferred.resolve(e.data.result);
		 //    };
		 //    this.worker.onerror = function(e) {
			// 	deferred.reject(['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join(''));
		 //    };
			// return deferred.promise;
			return this;
		}

		v(...ids:string[]):Pipeline;  //g.v()
        v(...ids:number[]):Pipeline;  //g.v()
        v(...objs:{}[]):Pipeline;     //g.V
        v(...args:any[]):Pipeline {
    		return new Pipeline('v', args, this.worker);
		}

		e(...ids:string[]):Pipeline;  //g.v()
        e(...ids:number[]):Pipeline;  //g.v()
        e(...objs:{}[]):Pipeline;     //g.V
        e(...args:any[]):Pipeline {
    		return new Pipeline('e', args, this.worker);
		}	
	}

	class MessageWorker {
		queue:any[];
		worker;
		//deferred;
		constructor(){
			this.worker = new Worker('heliosWorker.js');
			this.queue = [];
		}
		postMessage(message:any){


			var deferred = Q.defer();

			
				//this.queue.push({deferred:this.deferred, message:message});
				//var t = this.queue.shift();
				this.worker.onmessage = (e) => {
					//check for large data Token. If received don't resolve until
					//End Token received. Data will get appended in tempObj

					deferred.resolve(e.data.result);
					// if(this.queue.length > 0){
					// 	var i = this.queue.shift();
					// 	this.deferred = i.deferred;
					// 	this.worker.postMessage(i.message);
					// }
			    };
			    this.worker.onerror = function(e) {
					deferred.reject(['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join(''));
			    };
				message.id = UUID();
				this.worker.postMessage(message);
			
		    return deferred.promise;
		}
	}

	export class Pipeline {
		
		private messages:{}[];
        private deferreds:any[];
        id:()=>Pipeline;
        label:(...labels:string[])=>Pipeline;
        property:(prop:string)=>Pipeline;
		out:(...labels: string[]) => Pipeline;
		in:(...labels:string[])=>Pipeline;
		both:(...labels:string[])=>Pipeline;
        bothE:(...labels:string[])=>Pipeline;
        bothV:()=>Pipeline;
        inE:(...labels:string[])=>Pipeline;
        inV:()=>Pipeline;
        outE:(...labels:string[])=>Pipeline;
        outV:()=>Pipeline;

        // cap(...labels:string[])=>Pipeline;
        // gather(...labels:string[])=>Pipeline;        
        // map(...labels:string[])=>Pipeline;
        // memoize(...labels:string[])=>Pipeline;
        // order(...labels:string[])=>Pipeline;
        
        // path(...labels:string[])=>Pipeline;
        // scatter(...labels:string[])=>Pipeline;
        // select(...labels:string[])=>Pipeline;
        // transform(...labels:string[])=>Pipeline;
		constructor(method:string, args:any[], public worker:any){
			this.messages = [{method:method, parameters:args}];
			this.deferreds =[];

	        this.id = this.add('id');
	        this.label = this.add('label');
	        this.property = this.add('property');
			this.out = this.add('out');
			this.in = this.add('in');
			this.both = this.add('both');
	        this.bothE = this.add('bothE');
	        this.bothV = this.add('bothV');
	        this.inE = this.add('inE');
	        this.inV = this.add('inV');
	        this.outE = this.add('outE');
	        this.outV = this.add('outV');



		}
		add(func:string):()=>Pipeline{
			return function(...args:string[]):Pipeline{
                this.messages.push({method:func, parameters:args});
                return this;
            }
		}
		emit():any{

			var db = new SharedWorker('heliosWorker.js'),
				deferred = Q.defer();

			this.messages.push({method:'emit', paramaters:[]});

			function handler(event) {
				deferred.resolve(event.data.result);
				// no longer need this listener
				db.port.removeEventListener('message', handler, false);
		   	}
	   		db.port.addEventListener('message', handler, false);

			// post a message to the shared web worker
			db.port.start();
			db.port.postMessage({id:UUID(), message:this.messages});
			return deferred.promise;
		}
	}
    
}