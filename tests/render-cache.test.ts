import {test} from 'node:test'
import assert from 'node:assert/strict'
import {RenderCache} from '../src/utils/renderCache'
test('render cache reseeds SVG IDs, respects theme keys and bounds memory with LRU eviction',()=>{
 const cache=new RenderCache(2,200)
 cache.put('dark','svg-one','<svg id="svg-one"><use href="#svg-one"/></svg>')
 assert.equal(cache.get('light','next'),undefined)
 assert.match(cache.get('dark','svg-two')!,/id="svg-two"/)
 cache.put('two','b','<svg/>');cache.get('dark','new');cache.put('three','c','<svg/>')
 assert.equal(cache.get('two','x'),undefined)
 cache.put('huge','d','x'.repeat(150));assert.equal(cache.get('huge','x'),undefined)
 cache.clear();assert.equal(cache.get('dark','x'),undefined)
})
