
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

		setConfiguration(options:{}):void{
			this.mc.port1.postMessage({message:[{method:'setConfiguration', parameters:[options]}]})
		}

       setPathEnabled(turnOn:bool):void {
          this.mc.port1.postMessage({message:[{method:'setPathEnabled', parameters:[turnOn]}]})
       }

// //need to look at this
//        getPathEnabled():bool {
//            return this.pathEnabled;
//        }

		createVIndex(idxName:string):void {
            this.mc.port1.postMessage({message:[{method:'createVIndex', parameters:[idxName]}]})
        }

        createEIndex(idxName:string):void {
            this.mc.port1.postMessage({message:[{method:'createEIndex', parameters:[idxName]}]})
        }

        deleteVIndex(idxName:string):void {
            this.mc.port1.postMessage({message:[{method:'deleteVIndex', parameters:[idxName]}]})
        }

        deleteEIndex(idxName:string):void {
            this.mc.port1.postMessage({message:[{method:'deleteEIndex', parameters:[idxName]}]})
        }

		loadGraphSON(jsonData:string):void{
			this.mc.port1.postMessage({message:[{method:'loadGraphSON', parameters:[jsonData]}]})
		}

		loadGraphML(xmlData:string):void{
			this.mc.port1.postMessage({message:[{method:'loadGraphML', parameters:[xmlData]}]})
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

		}

		add(func:string, isFinal:bool=false):()=>any{
			return function(...args:string[]):any{
                this.messages.push({method:func, parameters:args});
                return isFinal ? this.promise(this.messages) : this;
            }
		}

		//Move into class
		promise(messages:{}[]):any {
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

			// post a message to the shared web worker
			mc.port1.start();
			mc.port1.postMessage({message:messages});
			return deferred.promise;
		}

	}
    
}