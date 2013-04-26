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
			this.db.invoke("run", [{method:'setConfiguration', parameters:[options]}]).then(function (message) {
                console.log(message);
            })
            .end()        
		}

		createVIndex(idxName:string):any {
			this.db.invoke("run", [{method:'createVIndex', parameters:[idxName]}]).then(function (message) {
                console.log(message);
            })
            .end()        
        }

        createEIndex(idxName:string):any {
			this.db.invoke("run", [{method:'createEIndex', parameters:[idxName]}]).then(function (message) {
                console.log(message);
            })
            .end()        
        }

        deleteVIndex(idxName:string):any {
			this.db.invoke("run", [{method:'deleteVIndex', parameters:[idxName]}]).then(function (message) {
                console.log(message);
            })
            .end()        
        }

        deleteEIndex(idxName:string):any {
			this.db.invoke("run", [{method:'deleteEIndex', parameters:[idxName]}]).then(function (message) {
                console.log(message);
            })
            .end();
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

        // gather(...labels:string[])=>Pipeline;        
        // memoize(...labels:string[])=>Pipeline;
        // order(...labels:string[])=>Pipeline;
        
        // scatter(...labels:string[])=>Pipeline;
        // select(...labels:string[])=>Pipeline;

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

	        this.id = this.add('id', true);
	        this.label = this.add('label', true);
	        this.property = this.add('property', true);
	        this.count = this.add('count', true);
	        this.stringify = this.add('stringify', false);
	        this.map = this.add('map', false);
	        this.hash = this.add('hash', false);
	        this.where = this.add('where', true);

	        this.index = this.add('index', true);
	        this.range = this.add('range', true);
	        this.dedup = this.add('dedup', true);
	        this.transform = this.add('transform', true);

	        this.as = this.add('as', true);
	        this.back = this.add('back', true);
	        this.optional = this.add('optional', true);

	        this.except = this.add('except', true);
	        this.retain = this.add('retain', true);
	        this.path = this.add('path', false);

		}

		add(func:string, callEmit:bool = true):()=>any{
			return function(...args:string[]):any{
				if(func == 'back' || func == 'path' || func == 'optional'){
					this.db.invoke("startTrace", true).fail(function(err){console.log(err.message);}).end();
				} 
                this.messages.push({method:func, parameters:args, emit:callEmit});
                return this;
            }
		}

		then(success?:()=>any, error?:()=>any):void{
			this.db.invoke("run", this.messages).then(success, error).end();
		}
	}
}