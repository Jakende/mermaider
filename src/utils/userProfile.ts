export interface LocalProfile { id:string; avatar:string }
let fallback:LocalProfile|undefined
export function localProfile():LocalProfile {
  if(fallback)return fallback
  try {
    const saved=JSON.parse(localStorage.getItem('mermaider-profile')||'null')
    if(saved&&typeof saved.id==='string'&&typeof saved.avatar==='string'&&saved.id.length<100&&saved.avatar.length<100){fallback=saved;return saved}
  }catch{/* Storage may be unavailable. */}
  fallback={id:crypto.randomUUID(),avatar:crypto.randomUUID()}
  try{localStorage.setItem('mermaider-profile',JSON.stringify(fallback))}catch{/* Keep a stable in-memory profile. */}
  return fallback
}
