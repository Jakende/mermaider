import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {spawnSync} from 'node:child_process'

test('release checks accept Windows line endings and reject Tauri minor mismatches', () => {
  const root=mkdtempSync(join(tmpdir(),'release-check-'))
  try {
    mkdirSync(join(root,'src-tauri'))
    for(const path of ['package.json','package-lock.json','src-tauri/tauri.conf.json','src-tauri/Cargo.toml','src-tauri/Cargo.lock']) {
      writeFileSync(join(root,path),readFileSync(path,'utf8').replace(/\r?\n/g,'\r\n'))
    }
    const script=resolve('scripts/check-release.mjs')
    const options={cwd:root,encoding:'utf8' as const,env:{...process.env,GITHUB_REF_TYPE:'branch'}}
    const valid=spawnSync(process.execPath,[script],options)
    assert.equal(valid.status,0,valid.stderr)
    const lock=JSON.parse(readFileSync(join(root,'package-lock.json'),'utf8'))
    lock.packages['node_modules/@tauri-apps/api'].version='2.99.0'
    writeFileSync(join(root,'package-lock.json'),JSON.stringify(lock))
    const invalid=spawnSync(process.execPath,[script],options)
    assert.notEqual(invalid.status,0)
    assert.match(invalid.stderr,/must use the same major\/minor/)
  } finally {rmSync(root,{recursive:true,force:true})}
})
