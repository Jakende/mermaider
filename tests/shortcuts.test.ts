import {test} from 'node:test'
import assert from 'node:assert/strict'
import {defaultShortcuts,shortcutAction,validateShortcuts} from '../src/utils/shortcuts'
test('custom shortcuts preserve platform modifiers and reject collisions or typing-only keys',()=>{
 const mapping=validateShortcuts({...defaultShortcuts,diagramLibrary:'Mod+Shift+d'})
 assert.equal(shortcutAction({key:'D',ctrlKey:true,metaKey:false,altKey:false,shiftKey:true},false,mapping),'diagramLibrary')
 assert.equal(shortcutAction({key:'d',ctrlKey:false,metaKey:true,altKey:false,shiftKey:true},true,mapping),'diagramLibrary')
 assert.equal(shortcutAction({key:'d',ctrlKey:false,metaKey:false,altKey:false,shiftKey:true},false,mapping),undefined)
 assert.throws(()=>validateShortcuts({...mapping,save:mapping.open}),/different/)
 assert.throws(()=>validateShortcuts({...mapping,save:'s'}),/Use Mod/)
 assert.equal(shortcutAction({key:'/',ctrlKey:true,metaKey:false,altKey:false,shiftKey:true},false,mapping),'help')
})
