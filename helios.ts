module Helios {

    declare var Q_COMM;

    export class GraphDatabase {

    	private worker:any;
    	private db:any;

        constructor(options?:any) {

    		this.worker = new Worker('./libs/heliosDB.js');
			this.db = Q_COMM.Connection(this.worker, null, {max: 1024});

            this.db.invoke("init", options)
            .then(function (message) {
                console.log(message);
            }).end();
  		}

		setConfiguration(options:{}):any{
			this.worker.postMessage({async:false, message:[{method:'setConfiguration', parameters:[options]}]});
		}

		setPathEnabled(turnOn:bool):any {
			this.worker.postMessage({async:false, message:[{method:'setPathEnabled', parameters:[turnOn]}]});
       }

// //need to look at this
//        getPathEnabled():bool {
//            return this.pathEnabled;
//        }

		createVIndex(idxName:string):any {
			this.worker.postMessage({async:false, message:[{method:'createVIndex', parameters:[idxName]}]});
        }

        createEIndex(idxName:string):any {
			this.worker.postMessage({async:false, message:[{method:'createEIndex', parameters:[idxName]}]});
        }

        deleteVIndex(idxName:string):any {
			this.worker.postMessage({async:false, message:[{method:'deleteVIndex', parameters:[idxName]}]});
        }

        deleteEIndex(idxName:string):any {
			this.worker.postMessage({async:false, message:[{method:'deleteEIndex', parameters:[idxName]}]});
        }

		loadGraphSON(jsonData:string):void{
			this.db.invoke("run", [{method:'loadGraphSON', parameters:[jsonData]}]).then(function (message) {
                console.log(message);
            })
            .end();
		}

		loadGraphML(xmlData:string):void{
			this.db.invoke("run", [{method:'loadGraphML', parameters:[xmlData]}]).then(function (message) {
                console.log(message);
            })
            .end();
		}

		v(...ids:string[]):Pipeline; 
        v(...ids:number[]):Pipeline; 
        v(...objs:{}[]):Pipeline;    
        v(...args:any[]):Pipeline {
    		return new Pipeline('v', args, this);
		}

		e(...ids:string[]):Pipeline; 
        e(...ids:number[]):Pipeline; 
        e(...objs:{}[]):Pipeline; 
        e(...args:any[]):Pipeline {
    		return new Pipeline('e', args, this);
		}	
	}

	export class Pipeline {
		
		private messages:{method:string; parameters:any[];}[];
		private db:any;

//		private noEmitArray:string[] = ['id','label','getProperty','count','stringify','hash','path', 'map'];

        id:()=>any[];
        label:()=>any[];
        property:(prop:string)=>any[];
        count:()=>number;
        stringify:()=>string;
        map:(...labels:string[])=>{}[];
        hash:()=>{};
	    path:()=>any[];

		out:(...labels: string[]) => Pipeline;
		in:(...labels:string[])=>Pipeline;
		both:(...labels:string[])=>Pipeline;
        bothE:(...labels:string[])=>Pipeline;
        bothV:()=>Pipeline;
        inE:(...labels:string[])=>Pipeline;
        inV:()=>Pipeline;
        outE:(...labels:string[])=>Pipeline;
        outV:()=>Pipeline;

        where:(...comparables:{}[])=> Pipeline;
        
        index:(...indices:number[])=> Pipeline;
	    range:(start:number, end?:number)=> Pipeline;
	    dedup:()=> Pipeline;

	    as:(name:string)=> Pipeline;
	    back:(x:any)=>Pipeline;
	    optional:(x:any)=>Pipeline;
	    except:(dataSet:{}[])=>Pipeline;
	    retain:(dataSet:{}[])=>Pipeline;

        transform:(func:string)=>Pipeline;

        // cap(...labels:string[])=>Pipeline;
        // gather(...labels:string[])=>Pipeline;        
        // map(...labels:string[])=>Pipeline;
        // memoize(...labels:string[])=>Pipeline;
        // order(...labels:string[])=>Pipeline;
        
        // path(...labels:string[])=>Pipeline;
        // scatter(...labels:string[])=>Pipeline;
        // select(...labels:string[])=>Pipeline;
        // transform(...labels:string[])=>Pipeline;

		constructor(method:string, args:any[], public helios:any){
			
			this.messages = [{method:method, parameters:args}];
			this.db = helios.db;

			this.out = this.add('out', true);
			this.in = this.add('in', true);
			this.both = this.add('both', true);
	        this.bothE = this.add('bothE', true);
	        this.bothV = this.add('bothV', true);
	        this.inE = this.add('inE', true);
	        this.inV = this.add('inV', true);
	        this.outE = this.add('outE', true);
	        this.outV = this.add('outV', true);

	        this.id = this.add('id', false);
	        this.label = this.add('label', false);
	        this.property = this.add('property');
	        this.count = this.add('count', false);
	        this.stringify = this.add('stringify', false);
	        this.map = this.add('map', false);
	        this.hash = this.add('hash', false);
	        this.where = this.add('where', true);

	        this.index = this.add('index', true);
	        this.range = this.add('range', true);
	        this.dedup = this.add('dedup', true);
	        this.transform = this.add('transform', false);

	        this.as = this.add('as', true);
	        this.back = this.add('back', true);
	        this.optional = this.add('optional', true);

	        this.except = this.add('except', true);
	        this.retain = this.add('retain', true);
	        this.path = this.add('path', false);

		}

		add(func:string, callEmit:bool = true):()=>any{
			return function(...args:string[]):any{
				if(func == 'back' || func == 'path'){
					this.db.invoke("pathTrace", true).fail(function(err){console.log(err.message);}).end();
				} 
				if (func == 'optional'){
					this.db.invoke("optionalTrace", true).fail(function(err){console.log(err.message);}).end();	
				}
				
                this.messages.push({method:func, parameters:args, emit:callEmit});
                return this;
            }
		}

		then(success?:()=>any, error?:()=>any):void{
			// var lastMethod = this.messages.slice(-1)[0].method;
			// if(this.noEmitArray.indexOf(lastMethod) == -1) {
			// 	this.messages.push({method:'emit', parameters:[]});
			// }
			this.db.invoke("run", this.messages).then(success, error).end();
		}

	}
    
}