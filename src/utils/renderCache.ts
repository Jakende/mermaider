/** Small in-memory cache. Diagram content is never persisted or sent anywhere. */
export class RenderCache {
 private entries=new Map<string,{svg:string;id:string}>()
 constructor(private maxEntries=8,private maxCharacters=1000000){}
 get(key:string,id:string):string|undefined{const value=this.entries.get(key);if(!value)return;this.entries.delete(key);this.entries.set(key,value);return value.svg.split(value.id).join(id)}
 put(key:string,id:string,svg:string){if(svg.length>this.maxCharacters/2)return;this.entries.delete(key);this.entries.set(key,{svg,id});while(this.entries.size>this.maxEntries||[...this.entries.values()].reduce((sum,value)=>sum+value.svg.length,0)>this.maxCharacters)this.entries.delete(this.entries.keys().next().value!)}
 clear(){this.entries.clear()}
}
export const diagramRenderCache=new RenderCache()
