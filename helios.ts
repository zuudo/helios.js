module Helios {

    declare var Q_COMM;

    export class GraphDatabase {

    	private worker:any;
    	private db:any;

		V:(...ids:string[])=>Pipeline;
		E:(...ids:string[])=>Pipeline;

        constructor(options?:any) {

    		this.worker = new Worker('./lib/heliosDB.js');
			this.db = Q_COMM.Connection(this.worker, null, {max: 1024});

			this.V = this.v;
			this.E = this.e;

            this.db.invoke("init", options)
            .then(function (message) {
                console.log(message);
            }).end();
  		}

		setConfiguration(options:{}):any{
			this.db.invoke("dbCommand", [{method:'setConfiguration', parameters:[options]}]).then(function (message) {
                console.log(message);
            })
            .end()        
		}

		createVIndex(idxName:string):any {
			this.db.invoke("dbCommand", [{method:'createVIndex', parameters:[idxName]}]).then(function (message) {
                console.log(message);
            })
            .end()        
        }

        createEIndex(idxName:string):any {
			this.db.invoke("dbCommand", [{method:'createEIndex', parameters:[idxName]}]).then(function (message) {
                console.log(message);
            })
            .end()        
        }

        deleteVIndex(idxName:string):any {
			this.db.invoke("dbCommand", [{method:'deleteVIndex', parameters:[idxName]}]).then(function (message) {
                console.log(message);
            })
            .end()        
        }

        deleteEIndex(idxName:string):any {
			this.db.invoke("dbCommand", [{method:'deleteEIndex', parameters:[idxName]}]).then(function (message) {
                console.log(message);
            })
            .end();
        }

		loadGraphSON(jsonData:string):void{
			this.db.invoke("dbCommand", [{method:'loadGraphSON', parameters:[jsonData]}]).then(function (message) {
                console.log(message);
            })
            .end();
		}

		loadGraphML(xmlData:string):void{
			this.db.invoke("dbCommand", [{method:'loadGraphML', parameters:[xmlData]}]).then(function (message) {
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
	    select:(list?:string[], ...func:string[])=>Pipeline;
	    except:(dataSet:{}[])=>Pipeline;
	    retain:(dataSet:{}[])=>Pipeline;
        transform:(func:string)=>Pipeline;
        filter:(func:string)=>Pipeline;
        ifThenElse:(ifFunc:string, thenFunc:string, elseFunc:string)=>Pipeline;
        loop:(stepBack:any, iterations:number, func?:string)=>Pipeline;

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
	        this.property = this.add('property');
	        this.count = this.add('count');
	        this.stringify = this.add('stringify');
	        this.map = this.add('map');
	        this.hash = this.add('hash');
	        this.where = this.add('where');

	        this.index = this.add('index');
	        this.range = this.add('range');
	        this.dedup = this.add('dedup');
	        this.transform = this.add('transform');
	        this.filter = this.add('filter');

	        this.as = this.add('as');
	        this.back = this.add('back', true);
	        this.optional = this.add('optional', true);
	        this.select = this.add('select', true);
	        this.ifThenElse = this.add('ifThenElse');
	        this.loop = this.add('loop');

	        this.except = this.add('except');
	        this.retain = this.add('retain');
	        this.path = this.add('path', true);
		}

		add(func:string, trace?:bool):()=>any{
			return function(...args:string[]):any{
				if(trace){
					this.db.invoke("startTrace", true).fail(function(err){console.log(err.message);}).end();
				} 
                this.messages.push({method:func, parameters:args});
                return this;
            }
		}

		then(success?:()=>any, error?:()=>any):void{
			this.db.invoke("run", this.messages).then(success, error).end();
		}
	}
}