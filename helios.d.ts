module Helios {
    interface IGraph {
        vertices: {};
        edges: {};
        v_idx: {};
        e_idx: {};
        _: Mogwai.Pipeline;
    }
    interface IConfiguration {
        pathEnabled: bool;
        date: {
            format: any;
        };
        currency: {
            symbol: any;
            decimal: string;
        };
        meta: {
            id: string;
            label: string;
            type: string;
            outEid: string;
            inEid: string;
            outVid: string;
            inVid: string;
            VOut: string;
            VIn: string;
        };
        http: {
            baseUri: string;
            port: number;
            graph: string;
            type: string;
            ssl: bool;
        };
    }
    class Graph implements IGraph, IConfiguration {
        public vertices: {};
        public edges: {};
        public v_idx: {};
        public e_idx: {};
        public _: Mogwai.Pipeline;
        public pathEnabled: bool;
        public date: {
            format: any;
        };
        public currency: {
            symbol: any;
            decimal: string;
        };
        public meta: {
            id: string;
            label: string;
            type: string;
            outEid: string;
            inEid: string;
            outVid: string;
            inVid: string;
            VOut: string;
            VIn: string;
        };
        public http: {
            baseUri: string;
            port: number;
            graph: string;
            type: string;
            ssl: bool;
        };
        public config: IConfiguration;
        constructor(graph?: Graph);
        public setConfiguration(options: {}): void;
        public loadVertices(rows: {}[]): void;
        public loadEdges(rows: {}[]): void;
        public createVIndex(idxName: string): void;
        public createEIndex(idxName: string): void;
        public deleteVIndex(idxName: string): void;
        public deleteEIndex(idxName: string): void;
        public tracePath(enabled: bool): bool;
        public loadGraphSON(jsonData: string): Graph;
        public loadGraphSON(jsonData: {
                vertices?: {}[];
                edges?: {}[];
            }): Graph;
        public loadGraphML(xmlData: string): Graph;
        public v(...ids: string[]): Mogwai.Pipeline;
        public v(...ids: number[]): Mogwai.Pipeline;
        public v(...objs: {}[]): Mogwai.Pipeline;
        public e(...ids: string[]): Mogwai.Pipeline;
        public e(...ids: number[]): Mogwai.Pipeline;
        public e(...objs: {}[]): Mogwai.Pipeline;
    }
    module Mogwai {
        function getEndPipe(): any[];
        interface IPipeline {
            out: (...labels: string[]) => Pipeline;
            in: (...labels: string[]) => Pipeline;
        }
        class Pipeline implements IPipeline {
            public graph: Graph;
            public pinned: bool;
            private pipeline;
            private traceObj;
            private tracing;
            private tracingPath;
            private pinned;
            private snapshot;
            private traversed;
            private steps;
            private asHash;
            private endPipe;
            constructor(graph: Graph, elements?: {}, clonedPipeline?: Pipeline, pinned?: bool);
            constructor(graph: Graph, elements?: {}[], clonedPipeline?: Pipeline, pinned?: bool);
            public startPipe(elements: any): Pipeline;
            public fork(o: {
                    _?: Pipeline;
                }): Pipeline;
            public pin(o: {
                    _?: Pipeline;
                }): Pipeline;
            public id(): any[];
            public label(): any[];
            public out(...labels: string[]): Pipeline;
            public in(...labels: string[]): Pipeline;
            public outV(): Pipeline;
            public inV(): Pipeline;
            public outE(...labels: string[]): Pipeline;
            public inE(...labels: string[]): Pipeline;
            public both(...labels: string[]): Pipeline;
            public bothV(): Pipeline;
            public bothE(...labels: string[]): Pipeline;
            public property(prop: string): any[];
            public sort(order?: number): Pipeline;
            public sort(func?: () => bool): Pipeline;
            public slice(start: number, end?: number): Pipeline;
            public itemAt(indices: number[]): Pipeline;
            public dedup(): Pipeline;
            public except(dataSet: {}[]): Pipeline;
            public intersect(dataSet: {}[]): Pipeline;
            public where(args: {}[]): Pipeline;
            public filter(func: () => any[], ...args: any[]): Pipeline;
            public min(arg: string): Pipeline;
            public max(arg: string): Pipeline;
            public as(name: string): Pipeline;
            public traceOn(): Pipeline;
            public traceOff(): Pipeline;
            public back(): Pipeline;
            public count(): number;
            public group(args: string[]): {};
            public sum(args: string[]): {};
            public step(func: () => any[], ...args: any[]): Pipeline;
            public store(x: any[], func?: () => any[], ...args: any[]): Pipeline;
            public loop(loopFor: number, stepBack?: string, func?: () => any[], ...args: any[]): Pipeline;
            public emit(...props: string[]): {
                results: any[];
            };
            public stringify(...props: string[]): string;
            public hash(): {};
            public path(): any[];
            public clone(): {}[];
        }
        class Compare {
            static $eq(objVal: any, val: any, graph: Graph): bool;
            static $neq(objVal: any, val: any, graph: Graph): bool;
            static $lt(objVal: any, val: any, graph: Graph): bool;
            static $lte(objVal: any, val: any, graph: Graph): bool;
            static $gt(objVal: any, val: any, graph: Graph): bool;
            static $gte(objVal: any, val: any, graph: Graph): bool;
            static $typeOf(objVal: any, val: string[], graph: Graph): bool;
            static $notTypeOf(objVal: any, val: string[], graph: Graph): bool;
            static $in(objVal: any, val: any[], graph: Graph): bool;
            static $nin(objVal: any, val: any[], graph: Graph): bool;
            static $match(objVal: any, val: string[], graph: Graph): bool;
            static $all(objVal: any[], val: any[], graph: Graph): bool;
            static $none(objVal: any[], val: any[], graph: Graph): bool;
            static $exact(objVal: any[], val: any[], graph: Graph): bool;
            static $hasAny(obj: {}, val: string[]): bool;
            static $hasAll(obj: {}, val: string[]): bool;
            static $notAny(obj: {}, val: string[]): bool;
            static $notAll(obj: {}, val: string[]): bool;
        }
    }
}
var message: {
    method: string;
    parameters: any[];
}[];
