#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BUMP_TYPES = new Set(['major', 'minor', 'patch', 'alpha'])
const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
]

export function parseVersion (version) {
    const match = /^(\d+)\.(\d+)\.(\d+)(.*)$/.exec(version)

    if (!match) {
        throw new Error(`Unsupported version "${version}". Expected a semantic version.`)
    }

    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        suffix: match[4],
    }
}

export function formatVersion ({ major, minor, patch, suffix = '' }) {
    return `${major}.${minor}.${patch}${suffix}`
}

function compareVersions (left, right) {
    return left.major - right.major
        || left.minor - right.minor
        || left.patch - right.patch
}

function highestVersion (versions) {
    return versions.reduce((highest, version) => {
        return compareVersions(version, highest) > 0 ? version : highest
    })
}

function alphaNumber (suffix) {
    const match = /^-alpha\.(\d+)$/.exec(suffix)

    if (!match) {
        throw new Error(
            `Cannot bump alpha prerelease from "${suffix || '(none)'}". Expected -alpha.<number>.`
        )
    }

    return Number(match[1])
}

function bumpVersion (version, bump) {
    if (bump === 'alpha') {
        return {
            ...version,
            suffix: `-alpha.${alphaNumber(version.suffix) + 1}`,
        }
    }

    if (bump === 'patch') {
        return { ...version, patch: version.patch + 1 }
    }

    if (bump === 'minor') {
        return { ...version, minor: version.minor + 1, patch: 0 }
    }

    return { ...version, major: version.major + 1, minor: 0, patch: 0 }
}

function laneVersion (packages, suffix, bump, forcedMajor) {
    const versions = packages.map(pkg => {
        const version = parseVersion(pkg.version)
        return {
            ...version,
            major: forcedMajor ?? (version.major <= 1 ? 1 : version.major),
            suffix: bump === 'alpha' ? version.suffix : suffix,
        }
    })

    const baseline = highestVersion(versions)

    if (bump === 'alpha') {
        baseline.suffix = `-alpha.${Math.max(...versions.map(version => alphaNumber(version.suffix)))}`
    }

    return formatVersion(bumpVersion(baseline, bump))
}

export function synchronizedVersions (packages, bump) {
    if (!BUMP_TYPES.has(bump)) {
        throw new Error(`Invalid bump "${bump}". Use major, minor, patch, or alpha.`)
    }

    const corePackage = packages.find(pkg => pkg.name === '@h3ravel/core')
    if (!corePackage) {
        throw new Error('Unable to find @h3ravel/core in the workspace.')
    }

    const core = parseVersion(corePackage.version)
    const suffix = core.suffix
    const lowerLane = packages.filter(pkg => parseVersion(pkg.version).major < 11)
    const upperLane = packages.filter(pkg => parseVersion(pkg.version).major >= 11)
    const targets = new Map()

    if (bump === 'major' && lowerLane.length > 0) {
        const lowerBaseline = highestVersion(lowerLane.map(pkg => parseVersion(pkg.version)))
        const targetMajor = Math.min(lowerBaseline.major + 1, 11)
        const target = formatVersion({
            major: targetMajor,
            minor: 0,
            patch: 0,
            suffix,
        })

        for (const pkg of lowerLane) targets.set(pkg.name, target)

        if (upperLane.length > 0) {
            const upperTarget = laneVersion(upperLane, suffix, 'minor')
            for (const pkg of upperLane) targets.set(pkg.name, upperTarget)
        }

        return targets
    }

    if (bump === 'major') {
        const majors = new Set(packages.map(pkg => parseVersion(pkg.version).major))
        if (majors.size !== 1 || !majors.has(core.major)) {
            throw new Error(
                `Cannot advance beyond ${core.major}.x until every package has reached that major.`
            )
        }

        const target = laneVersion(packages, suffix, 'major', core.major)
        for (const pkg of packages) targets.set(pkg.name, target)
        return targets
    }

    if (lowerLane.length > 0) {
        const target = laneVersion(lowerLane, suffix, bump)
        for (const pkg of lowerLane) targets.set(pkg.name, target)
    }

    if (upperLane.length > 0) {
        const target = laneVersion(upperLane, suffix, bump)
        for (const pkg of upperLane) targets.set(pkg.name, target)
    }

    return targets
}

export function updateWorkspaceRange (range, nextDependencyVersion) {
    const match = /^(workspace:(?:\^|~)?)(\d+\.\d+\.\d+.*)$/.exec(range)
    if (!match) return range

    return `${match[1]}${nextDependencyVersion}`
}

export function buildVersionPlan (packages, bump) {
    const nextVersions = synchronizedVersions(packages, bump)

    return packages.map(pkg => {
        const json = structuredClone(pkg.json)
        json.version = nextVersions.get(pkg.name)

        for (const field of DEPENDENCY_FIELDS) {
            if (!json[field]) continue

            for (const [dependency, range] of Object.entries(json[field])) {
                const nextDependencyVersion = nextVersions.get(dependency)
                if (!nextDependencyVersion || typeof range !== 'string') continue

                json[field][dependency] = updateWorkspaceRange(range, nextDependencyVersion)
            }
        }

        return {
            ...pkg,
            nextVersion: json.version,
            changed: JSON.stringify(json) !== JSON.stringify(pkg.json),
            json,
        }
    })
}

function findWorkspaceRoot () {
    let current = dirname(fileURLToPath(import.meta.url))

    while (current !== dirname(current)) {
        if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current
        current = dirname(current)
    }

    throw new Error('Unable to locate pnpm-workspace.yaml.')
}

function loadPackages (workspaceRoot) {
    const packagesDir = join(workspaceRoot, 'packages')

    return readdirSync(packagesDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => join(packagesDir, entry.name, 'package.json'))
        .filter(existsSync)
        .map(file => {
            const json = JSON.parse(readFileSync(file, 'utf8'))
            return { file, json, name: json.name, version: json.version }
        })
        .filter(pkg => pkg.name?.startsWith('@h3ravel/') && typeof pkg.version === 'string')
        .sort((a, b) => a.name.localeCompare(b.name))
}

function printPlan (plan, dryRun) {
    console.log(dryRun ? 'Package version plan (dry run):' : 'Updating package versions:')

    for (const pkg of plan) {
        const marker = pkg.version === pkg.nextVersion ? '=' : '->'
        console.log(`  ${pkg.name}: ${pkg.version} ${marker} ${pkg.nextVersion}`)
    }
}

function writePlan (plan) {
    const originals = new Map()

    for (const pkg of plan) {
        if (!pkg.changed) continue
        originals.set(pkg.file, readFileSync(pkg.file, 'utf8'))
        writeFileSync(pkg.file, `${JSON.stringify(pkg.json, null, 2)}\n`)
    }

    return originals
}

function restoreFiles (originals) {
    for (const [file, content] of originals) {
        writeFileSync(file, content)
    }
}

function updateLockfile (workspaceRoot) {
    console.log('\nUpdating pnpm-lock.yaml...')
    execFileSync('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], {
        cwd: workspaceRoot,
        stdio: 'inherit',
    })
}

export function run (argv = process.argv.slice(2)) {
    const bump = argv.find(arg => !arg.startsWith('--'))
    const dryRun = argv.includes('--dry-run')
    const skipLockfile = argv.includes('--no-lockfile')

    if (!bump || !BUMP_TYPES.has(bump)) {
        throw new Error(
            'Usage: node packages/scripts/version-packages.mjs <major|minor|patch|alpha> [--dry-run] [--no-lockfile]'
        )
    }

    const workspaceRoot = findWorkspaceRoot()
    const packages = loadPackages(workspaceRoot)
    const plan = buildVersionPlan(packages, bump)

    printPlan(plan, dryRun)

    if (dryRun) return

    const originals = writePlan(plan)

    if (!skipLockfile) {
        const lockfile = join(workspaceRoot, 'pnpm-lock.yaml')
        const originalLockfile = existsSync(lockfile) ? readFileSync(lockfile, 'utf8') : undefined

        try {
            updateLockfile(workspaceRoot)
        } catch (error) {
            restoreFiles(originals)

            if (originalLockfile !== undefined) {
                writeFileSync(lockfile, originalLockfile)
            }

            throw new Error(
                `Lockfile update failed; package versions were restored.\n${error instanceof Error ? error.message : error}`
            )
        }
    }
}

const isMain = resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)

if (isMain) {
    try {
        run()
    } catch (error) {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
    }
}
