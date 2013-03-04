
module Helios {

    declare var Q;
    export class GraphDatabase {
    	//Make arguments optional
    	db;
    	mc;
    	//constructor(graph?:Graph);
        constructor(options?:any) {
    		var msg:{method:string; parameters?:any;} = { method:'init'};
    		if(!!options){
    			msg.parameters = [options];
    		}

    		this.db = new Worker('heliosDB.js');

    		this.mc = new MessageChannel();
    		this.db.postMessage(msg, [this.mc.port2]);

    		this.mc.port1.onmessage = (e) => {
				console.log(e.data);
			};
    		
		}

		setConfiguration(options:{}):void{
			this.mc.port1.postMessage({message:[{method:'setConfiguration', parameters:[options]}]})
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
            this.mc.port1.postMessage({message:[{method:'createVIndex', parameters:[idxName]}]})
				//.then(function(val){console.log(val)});
			//return this;
        }

        createEIndex(idxName:string):void {
            this.mc.port1.postMessage({message:[{method:'createEIndex', parameters:[idxName]}]})
				//.then(function(val){console.log(val)});
			//return this;
        }

        deleteVIndex(idxName:string):void {
            this.mc.port1.postMessage({message:[{method:'deleteVIndex', parameters:[idxName]}]})
				//.then(function(val){console.log(val)});
        }

        deleteEIndex(idxName:string):void {
            this.mc.port1.postMessage({message:[{method:'deleteEIndex', parameters:[idxName]}]})
				//.then(function(val){console.log(val)});
        }

		loadGraphSON(jsonData:string):GraphDatabase{
			this.mc.port1.postMessage({message:[{method:'loadGraphSON', parameters:[jsonData]}]})
				//.then(function(val){console.log(val)});
			return this;
		}

		loadGraphML(xmlData:string):void{
			//var deferred = Q.defer();
			this.mc.port1.postMessage({message:[{method:'loadGraphML', parameters:[xmlData]}]})
				//.then(function(val){console.log(val)});

			// this.worker.onmessage = function(e) {
			// 	deferred.resolve(e.data.result);
		 //    };
		 //    this.worker.onerror = function(e) {
			// 	deferred.reject(['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join(''));
		 //    };
			// return deferred.promise;
			//return this;
		}

		v(...ids:string[]):Pipeline;  //g.v()
        v(...ids:number[]):Pipeline;  //g.v()
        v(...objs:{}[]):Pipeline;     //g.V
        v(...args:any[]):Pipeline {
    		return new Pipeline('v', args, this.db);
		}

		e(...ids:string[]):Pipeline;  //g.v()
        e(...ids:number[]):Pipeline;  //g.v()
        e(...objs:{}[]):Pipeline;     //g.V
        e(...args:any[]):Pipeline {
    		return new Pipeline('e', args, this.db);
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
		constructor(method:string, args:any[], public dbWorker:any){
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
			var mc = new MessageChannel(),
				deferred = Q.defer();

			this.dbWorker.postMessage({}, [mc.port2]);
			this.messages.push({method:'emit', paramaters:[]});

			function handler(event) {
				deferred.resolve(event.data.result);
				// no longer need this listener
				mc.port1.removeEventListener('message', handler, false);
				mc.port1.close();
		   	}
	   		mc.port1.addEventListener('message', handler, false);

			// post a message to the shared web worker
			mc.port1.start();
			mc.port1.postMessage({message:this.messages});
			return deferred.promise;
		}
	}
    
}