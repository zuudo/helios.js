
module Helios {
    //var worker = new Worker('heliosWorker.js');
    
    // var func = function(){return this;};
    // worker.postMessage(func.toString()); // Start the worker.

    declare var Q;

    export class Graph {
    	worker;
    	constructor(){
    		this.worker = new MessagePromise();//new Worker('heliosWorker.js');
    		this.worker.postMessage({method:'init'})
    			.then(function(val){console.log(val)});
		}

		loadGraphSON(jsonData:string):Graph{
			this.worker.postMessage([{method:'loadGraphSON', parameters:[jsonData]}])
				.then(function(val){console.log(val)});
			return this;
		}

		loadGraphML(xmlData:string):Graph{
			this.worker.postMessage([{method:'loadGraphML', parameters:[xmlData]}])
				.then(function(val){console.log(val)});
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

	class MessagePromise {
		worker;
		constructor(){
			this.worker = new Worker('heliosWorker.js');
		}
		postMessage(message:any){
			var deferred = Q.defer();
			this.worker.postMessage(message);
			this.worker.onmessage = function(e) {
				deferred.resolve(e.data);
		    };
		    this.worker.onerror = function(e) {
				deferred.reject(['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join(''));
		    };
		    return deferred.promise;
		}
	}

	export class Pipeline {
		
		private messages:{}[];
        
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
			this.messages.push({method:'emit', paramaters:[]});
			return this.worker.postMessage(this.messages);
		}
	}
    
}