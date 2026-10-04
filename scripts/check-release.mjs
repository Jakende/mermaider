import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const tauri = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'))
const cargoLockText = readFileSync('src-tauri/Cargo.lock', 'utf8').replace(/\r\n/g, '\n')
const cargoLock = cargoLockText.match(/\[\[package\]\]\nname = "mermaider"\nversion = "([^"]+)"/)?.[1]
const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8').match(/^version = "([^"]+)"/m)?.[1]
for (const [name, version] of Object.entries({ lock: lock.version, lockRoot: lock.packages[''].version, tauri: tauri.version, cargo, cargoLock })) {
  assert.equal(version, pkg.version, `${name} version must match package.json`)
}
if (process.env.GITHUB_REF_TYPE === 'tag') assert.equal(process.env.GITHUB_REF_NAME, `v${pkg.version}`, 'Release tag must match manifest versions')
console.log(`Release manifests agree: ${pkg.version}`)

for (const [crate, npmPackage] of [['tauri', '@tauri-apps/api'], ['tauri-plugin-http', '@tauri-apps/plugin-http']]) {
  const rustVersion = cargoLockText.match(new RegExp(`\\[\\[package\\]\\]\\nname = "${crate}"\\nversion = "([^"]+)"`))?.[1]
  const npmVersion = lock.packages[`node_modules/${npmPackage}`]?.version
  assert.ok(rustVersion && npmVersion, `Missing locked version for ${crate}`)
  assert.equal(npmVersion.split('.').slice(0, 2).join('.'), rustVersion.split('.').slice(0, 2).join('.'), `${crate} and ${npmPackage} must use the same major/minor`)
}
console.log('Locked Tauri Rust/JavaScript versions are compatible')
