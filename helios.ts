
module Helios {

    declare var Q;
    export class GraphDatabase {

    	db:any;
    	mc:any;

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

		setConfiguration(options:{}):any{
			return new Promise([{method:'setConfiguration', parameters:[options]}], this.db);
		}

		setPathEnabled(turnOn:bool):any {
			return new Promise([{method:'setPathEnabled', parameters:[turnOn]}], this.db);
       }

// //need to look at this
//        getPathEnabled():bool {
//            return this.pathEnabled;
//        }

		createVIndex(idxName:string):any {
			return new Promise([{method:'createVIndex', parameters:[idxName]}], this.db);
        }

        createEIndex(idxName:string):any {
			return new Promise([{method:'createEIndex', parameters:[idxName]}], this.db);
        }

        deleteVIndex(idxName:string):any {
			return new Promise([{method:'deleteVIndex', parameters:[idxName]}], this.db);
        }

        deleteEIndex(idxName:string):any {
			return new Promise([{method:'deleteEIndex', parameters:[idxName]}], this.db);
        }

		loadGraphSON(jsonData:string):any{
			return new Promise([{method:'loadGraphSON', parameters:[jsonData]}], this.db);
		}

		loadGraphML(xmlData:string):any{
			return new Promise([{method:'loadGraphML', parameters:[xmlData]}], this.db);
		}

		v(...ids:string[]):Pipeline; 
        v(...ids:number[]):Pipeline; 
        v(...objs:{}[]):Pipeline;    
        v(...args:any[]):Pipeline {
    		return new Pipeline('v', args, this.db);
		}

		e(...ids:string[]):Pipeline; 
        e(...ids:number[]):Pipeline; 
        e(...objs:{}[]):Pipeline; 
        e(...args:any[]):Pipeline {
    		return new Pipeline('e', args, this.db);
		}	
	}

	class Promise {
		constructor(messages:{}[], public dbWorker:any){
			var mc = new MessageChannel(),
				deferred = Q.defer();

			this.dbWorker.postMessage({}, [mc.port2]);
			
			function handler(event) {
				deferred.resolve(event.data.result);
				// no longer need this listener
				mc.port1.removeEventListener('message', handler, false);
				mc.port1.close();
		   	}
	   		mc.port1.addEventListener('message', handler, false);

			// post a message to the web worker
			mc.port1.start();
			mc.port1.postMessage({message:messages});
			return deferred.promise;
		}
	}

	export class Pipeline {
		
		private messages:{}[];

		out:(...labels: string[]) => Pipeline;
		in:(...labels:string[])=>Pipeline;
		both:(...labels:string[])=>Pipeline;
        bothE:(...labels:string[])=>Pipeline;
        bothV:()=>Pipeline;
        inE:(...labels:string[])=>Pipeline;
        inV:()=>Pipeline;
        outE:(...labels:string[])=>Pipeline;
        outV:()=>Pipeline;

        id:()=>any[];
        label:()=>any[];
        getProperty:(prop:string)=>any[];
        count:()=>number;
        stringify:()=>string;
        hash:()=>{};
        emit:()=>any;

        path:()=>any[];

        step:(func:() => any[], ...args:any[])=>Pipeline;

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

			this.out = this.add('out');
			this.in = this.add('in');
			this.both = this.add('both');
	        this.bothE = this.add('bothE');
	        this.bothV = this.add('bothV');
	        this.inE = this.add('inE');
	        this.inV = this.add('inV');
	        this.outE = this.add('outE');
	        this.outV = this.add('outV');

	        this.id = this.add('id', true);
	        this.label = this.add('label', true);
	        this.getProperty = this.add('getProperty', true);
	        this.count = this.add('count', true);
	        this.stringify = this.add('stringify', true);
	        this.hash = this.add('hash', true);
	        this.emit = this.add('emit', true);

	        this.path = this.add('path', true);

	        this.step = this.add('step');

		}

		add(func:string, isFinal:bool=false):()=>any{
			return function(...args:string[]):any{
				// if(typeof args[0] === 'function'){
				// 	args[0] = args[0].toString();
				// }
                this.messages.push({method:func, parameters:args});
                return isFinal ? new Promise(this.messages, this.dbWorker) : this;
            }
		}

	}
    
}