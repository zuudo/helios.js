
module Helios {

    declare var Q;

    export class GraphDatabase {
    	db;
    	dbName;
    	constructor(name:string);
    	constructor(options:{ db:{name:string;}; });
    	constructor(args:any){
    		if(typeof args === 'string'){
    			this.dbName = args;
    			args = {db:{name:this.dbName}};
    		} else {
    			this.dbName = args.db.name;	
    		}
    		this.db = new SharedWorker('heliosDB.js', this.dbName);
    		this.db.port.onmessage = (e) => {
				console.log(e.data);
			};
			// post a message to the shared web worker
			this.db.port.postMessage({method:'init', parameters:[args]});
    		
		}

		setConfiguration(options:{}):void{
			this.db.port.postMessage([{method:'setConfiguration', parameters:[options]}])
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
            this.db.port.postMessage([{method:'createVIndex', parameters:[idxName]}])
				//.then(function(val){console.log(val)});
			//return this;
        }

        createEIndex(idxName:string):void {
            this.db.port.postMessage([{method:'createEIndex', parameters:[idxName]}])
				//.then(function(val){console.log(val)});
			//return this;
        }

        deleteVIndex(idxName:string):void {
            this.db.port.postMessage([{method:'deleteVIndex', parameters:[idxName]}])
				//.then(function(val){console.log(val)});
        }

        deleteEIndex(idxName:string):void {
            this.db.port.postMessage([{method:'deleteEIndex', parameters:[idxName]}])
				//.then(function(val){console.log(val)});
        }

		loadGraphSON(jsonData:string):GraphDatabase{
			this.db.port.postMessage([{method:'loadGraphSON', parameters:[jsonData]}])
				//.then(function(val){console.log(val)});
			return this;
		}

		loadGraphML(xmlData:string):void{
			//var deferred = Q.defer();
			this.db.port.postMessage({message:[{method:'loadGraphML', parameters:[xmlData]}]})
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
    		return new Pipeline('v', args, this.dbName);
		}

		e(...ids:string[]):Pipeline;  //g.v()
        e(...ids:number[]):Pipeline;  //g.v()
        e(...objs:{}[]):Pipeline;     //g.V
        e(...args:any[]):Pipeline {
    		return new Pipeline('e', args, this.dbName);
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
		constructor(method:string, args:any[], public dbName:string){
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

			var db = new SharedWorker('heliosDB.js', this.dbName),
				deferred = Q.defer();

			this.messages.push({method:'emit', paramaters:[]});

			function handler(event) {
				deferred.resolve(event.data.result);
				// no longer need this listener
				db.port.removeEventListener('message', handler, false);
				db.port.close();
		   	}
	   		db.port.addEventListener('message', handler, false);

			// post a message to the shared web worker
			db.port.start();
			db.port.postMessage({message:this.messages});
			return deferred.promise;
		}
	}
    
}