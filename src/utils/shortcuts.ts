export const defaultShortcuts={diagramLibrary:'Mod+k',newDiagram:'Mod+n',open:'Mod+o',save:'Mod+s',close:'Mod+w',editor:'Mod+b',chat:'Mod+j',focusChat:'Mod+l',chatMode:'Mod+e',settings:'Mod+,',help:'Mod+/',undoAI:'Mod+Shift+r'} as const
export type ShortcutAction=keyof typeof defaultShortcuts
export type Shortcuts=Record<ShortcutAction,string>
export function validateShortcuts(value:unknown):Shortcuts {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Choose a shortcut for every action.')
 const result={...defaultShortcuts} as Shortcuts
 for(const action of Object.keys(defaultShortcuts) as ShortcutAction[]){const key=(value as Shortcuts)[action];if(typeof key!=='string'||!/^Mod\+(Shift\+)?([a-z0-9]|[,/])$/.test(key))throw new Error('Use Mod+k or Mod+Shift+k. Mod means Command on Mac and Control elsewhere.');if(key==='Mod+t')throw new Error('Mod+t is reserved for a new diagram.');result[action]=key}
 if(new Set(Object.values(result)).size!==Object.keys(result).length)throw new Error('Each action needs a different shortcut.')
 return result
}
export function getShortcuts():Shortcuts{try{return validateShortcuts(JSON.parse(localStorage.getItem('mermaider-shortcuts')||'null'))}catch{return {...defaultShortcuts}}}
export function shortcutAction(event:Pick<KeyboardEvent,'key'|'ctrlKey'|'metaKey'|'altKey'|'shiftKey'>,isMac:boolean,shortcuts=getShortcuts()):ShortcutAction|undefined {
 if(event.altKey||!(isMac?event.metaKey:event.ctrlKey)||isMac&&event.ctrlKey||!isMac&&event.metaKey)return
 const combination=`Mod+${event.shiftKey?'Shift+':''}${event.key.toLowerCase()}`
 return (Object.keys(shortcuts) as ShortcutAction[]).find(action=>shortcuts[action]===combination)
}
