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

		private noEmitArray:string[] = ['id','label','getProperty','count','stringify','hash','path'];

        id:()=>any[];
        label:()=>any[];
        getProperty:(prop:string)=>any[];
        count:()=>number;
        stringify:()=>string;
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
        
        itemAt:(...indices:number[])=> Pipeline;
	    range:(start:number, end?:number)=> Pipeline;
	    dedup:()=> Pipeline;

	    as:(name:string)=> Pipeline;
	    except:(dataSet:{}[])=>Pipeline;
	    retain:(dataSet:{}[])=>Pipeline;

        //step:(func:() => any[], ...args:any[])=>Pipeline;

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

			this.out = this.add('out');
			this.in = this.add('in');
			this.both = this.add('both');
	        this.bothE = this.add('bothE');
	        this.bothV = this.add('bothV');
	        this.inE = this.add('inE');
	        this.inV = this.add('inV');
	        this.outE = this.add('outE');
	        this.outV = this.add('outV');

	        this.id = this.add('id');
	        this.label = this.add('label');
	        this.getProperty = this.add('getProperty');
	        this.count = this.add('count');
	        this.stringify = this.add('stringify');
	        this.hash = this.add('hash');
	        this.where = this.add('where');

	        this.itemAt = this.add('itemAt');
	        this.range = this.add('range');
	        this.dedup = this.add('dedup');

	        this.as = this.add('as');
	        this.except = this.add('except');
	        this.retain = this.add('retain');
	        this.path = this.add('path');

	        //this.step = this.add('step');


		}

		add(func:string):()=>any{
			return function(...args:string[]):any{
                this.messages.push({method:func, parameters:args});
                return this;
            }
		}

		then(success?:()=>any, error?:()=>any):void{
			var ctx = this;
			var lastMethod = this.messages.slice(-1)[0].method;

			//if the lastMethod == 'path' the turn on trace
			if(lastMethod == 'path'){
				this.db.invoke("setPathEnabled", true)
					.then(function(val){
						ctx.db.invoke("run", ctx.messages).then(success, error).end();
					}).end();
				return;
			}
			if(this.noEmitArray.indexOf(lastMethod) == -1) {
				this.messages.push({method:'emit', parameters:[]});
			}
			this.db.invoke("run", this.messages).then(success, error).end();
		}

	}
    
}