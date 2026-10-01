#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg) {
  console.log(`[RELEASE] ${msg}`);
}

function error(msg) {
  console.error(`[ERROR] ${msg}`);
  process.exit(1);
}

// 1. Check git status
try {
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    error('Working directory has uncommitted changes. Commit the reviewed changes before running the release helper.');
  }
} catch (e) {
  error('Failed to run git status. Is git installed and is this a git repo?');
}

// 2. Read current version from package.json
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  error('package.json not found in current directory.');
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;
log(`Current version: ${currentVersion}`);

// 3. Determine next version
const bumpType = process.argv[2] || '';
let nextVersion = '';

if (bumpType) {
  let [major, minor, patch] = currentVersion.split('.').map(Number);
  if (bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
    nextVersion = `${major}.${minor}.${patch}`;
  } else if (bumpType === 'minor') {
    minor += 1;
    patch = 0;
    nextVersion = `${major}.${minor}.${patch}`;
  } else if (bumpType === 'patch') {
    patch += 1;
    nextVersion = `${major}.${minor}.${patch}`;
  } else if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
    nextVersion = bumpType;
  } else {
    error(`Invalid bump type or version: "${bumpType}". Use patch, minor, major, or a specific version string like 1.8.3.`);
  }
} else {
  // No argument provided: check if current version is already tagged
  let tagExists = false;
  try {
    // Check if tag v${currentVersion} exists locally or on remote
    const checkLocal = execSync(`git tag -l "v${currentVersion}"`).toString().trim();
    if (checkLocal) {
      tagExists = true;
    } else {
      // Check remote tags
      const checkRemote = execSync(`git ls-remote --tags origin "v${currentVersion}"`).toString().trim();
      if (checkRemote) {
        tagExists = true;
      }
    }
  } catch (e) {
    log('Warning: Failed to check remote tags. Assuming tag does not exist.');
  }

  if (tagExists) {
    log(`Tag v${currentVersion} already exists. Bumping patch version...`);
    let [major, minor, patch] = currentVersion.split('.').map(Number);
    patch += 1;
    nextVersion = `${major}.${minor}.${patch}`;
  } else {
    log(`Tag v${currentVersion} does not exist yet. Releasing current version ${currentVersion} directly...`);
    nextVersion = currentVersion;
  }
}

log(`Target version: ${nextVersion}`);

// 4. Update package.json
if (packageJson.version !== nextVersion) {
  packageJson.version = nextVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  log('Updated package.json');
} else {
  log('package.json version is already up to date.');
}

// 5. Update package-lock.json
const packageLockJsonPath = path.resolve(process.cwd(), 'package-lock.json');
if (fs.existsSync(packageLockJsonPath)) {
  const lockJson = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));
  let lockUpdated = false;
  if (lockJson.version !== nextVersion) {
    lockJson.version = nextVersion;
    lockUpdated = true;
  }
  if (lockJson.packages && lockJson.packages[''] && lockJson.packages[''].version !== nextVersion) {
    lockJson.packages[''].version = nextVersion;
    lockUpdated = true;
  }
  if (lockUpdated) {
    fs.writeFileSync(packageLockJsonPath, JSON.stringify(lockJson, null, 2) + '\n');
    log('Updated package-lock.json');
  } else {
    log('package-lock.json version is already up to date.');
  }
}

// 6. Update src-tauri/tauri.conf.json
const tauriConfPath = path.resolve(process.cwd(), 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  if (tauriConf.version !== nextVersion) {
    tauriConf.version = nextVersion;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
    log('Updated src-tauri/tauri.conf.json');
  } else {
    log('src-tauri/tauri.conf.json version is already up to date.');
  }
} else {
  log('Warning: src-tauri/tauri.conf.json not found.');
}

// 7. Update Cargo.toml
const cargoTomlPath = path.resolve(process.cwd(), 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoTomlPath)) {
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  const versionRegex = /^version\s*=\s*"[^"]+"/m;
  const match = cargoToml.match(versionRegex);
  if (match && match[0] !== `version = "${nextVersion}"`) {
    cargoToml = cargoToml.replace(versionRegex, `version = "${nextVersion}"`);
    fs.writeFileSync(cargoTomlPath, cargoToml);
    log('Updated src-tauri/Cargo.toml');
  } else {
    log('src-tauri/Cargo.toml version is already up to date.');
  }
} else {
  log('Warning: src-tauri/Cargo.toml not found.');
}

// 8. Update Cargo.lock via cargo check
try {
  log('Running cargo check to update Cargo.lock...');
  execSync('cargo check --manifest-path src-tauri/Cargo.toml', { stdio: 'inherit' });
  log('Cargo.lock check completed');
} catch (e) {
  error('Failed to run cargo check. Make sure rust/cargo is installed.');
}

// 9. Run compile/build check to prevent release of broken code
try {
  log('Running frontend build validation...');
  execSync('npm run check:release && npm test && npm run build && npm run test:e2e', { stdio: 'inherit' });
  log('Build verification passed successfully!');
} catch (e) {
  error('Build verification failed. Please fix compilation issues before releasing.');
}

// 10. Stage and commit
try {
  log('Staging files...');
  execSync('git add package.json package-lock.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock', { stdio: 'inherit' });
  
  const commitMsg = `chore: release v${nextVersion}`;
  log(`Committing as "${commitMsg}"...`);
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
  
  log(`Creating tag v${nextVersion}...`);
  execSync(`git tag v${nextVersion}`, { stdio: 'inherit' });
} catch (e) {
  error(`Failed to commit or tag release v${nextVersion}.`);
}

// 11. Push to GitHub
try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  log(`Pushing branch "${currentBranch}" and tag "v${nextVersion}" to origin...`);
  execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
  execSync(`git push origin v${nextVersion}`, { stdio: 'inherit' });
  log(`\n🎉 SUCCESS: Released v${nextVersion} to GitHub!`);
  log('The GitHub Action release workflow will now build and package the desktop binaries.');
} catch (e) {
  error('Failed to push changes and tag to remote repository. Check your connection or git credentials.');
}
