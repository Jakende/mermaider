import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { createHash } from 'node:crypto'
const root = process.argv[2]
if (!root) throw new Error('Pass the bundle directory')
function files(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(entry=> {
    const path=join(dir,entry.name)
    return entry.isDirectory() ? files(path) : /\.(dmg|exe|deb|AppImage)$/.test(entry.name) ? [path] : []
  })
}
const installers=files(root).sort()
if (!installers.length) throw new Error('No DMG, EXE, DEB or AppImage installer was built')
const sums=installers.map(path=>`${createHash('sha256').update(readFileSync(path)).digest('hex')}  ${relative(root,path).replaceAll('\\','/')}`)
writeFileSync(join(root,'SHA256SUMS.txt'),sums.join('\n')+'\n')
console.log(`Checksums generated for ${installers.length} installer(s)`)
