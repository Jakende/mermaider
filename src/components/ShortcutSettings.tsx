import {useState} from 'react'
import {defaultShortcuts,getShortcuts,validateShortcuts} from '../utils/shortcuts'
import type {ShortcutAction} from '../utils/shortcuts'
const labels:Record<ShortcutAction,string>={diagramLibrary:'Search diagrams',newDiagram:'New diagram',open:'Open file',save:'Save/export',close:'Close diagram',editor:'Toggle editor',chat:'Toggle chat',focusChat:'Focus chat',chatMode:'Switch chat mode',settings:'Open settings',help:'Open help',undoAI:'Undo AI change'}
export default function ShortcutSettings(){
 const [shortcuts,setShortcuts]=useState(getShortcuts),[message,setMessage]=useState('')
 const save=()=>{try{const checked=validateShortcuts(shortcuts);localStorage.setItem('mermaider-shortcuts',JSON.stringify(checked));setMessage('Shortcuts saved.')}catch(e){setMessage(e instanceof Error?e.message:'Shortcuts could not be saved.')}}
 return <details><summary>Keyboard shortcuts</summary><p>Mod means Command on Mac, Control elsewhere. Use Mod+k or Mod+Shift+k. Escape and Mod+t retain their standard actions.</p>{(Object.keys(labels) as ShortcutAction[]).map(action=><label className="settings-field" key={action}>{labels[action]}<input aria-label={`${labels[action]} shortcut`} value={shortcuts[action]} onChange={event=>setShortcuts({...shortcuts,[action]:event.target.value})}/></label>)}<button onClick={save}>Apply shortcuts</button><button onClick={()=>{try{localStorage.removeItem('mermaider-shortcuts');setShortcuts({...defaultShortcuts});setMessage('Default shortcuts restored.')}catch{setMessage('Storage unavailable.')}}}>Restore default shortcuts</button>{message&&<p role="status">{message}</p>}</details>
}
