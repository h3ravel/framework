import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
    buildVersionPlan,
    synchronizedVersions,
    updateWorkspaceRange,
} from './version-packages.mjs'

const packages = [
    { name: '@h3ravel/core', version: '1.22.0-alpha.10' },
    { name: '@h3ravel/contracts', version: '0.29.0-alpha.10' },
    { name: '@h3ravel/http', version: '11.8.0-alpha.10' },
    { name: '@h3ravel/console', version: '11.15.0-alpha.10' },
]

describe('synchronizedVersions', () => {
    it('assigns one patch version to every package in each lane', () => {
        const versions = synchronizedVersions(packages, 'patch')

        assert.equal(versions.get('@h3ravel/core'), '1.29.1-alpha.10')
        assert.equal(versions.get('@h3ravel/contracts'), '1.29.1-alpha.10')
        assert.equal(versions.get('@h3ravel/http'), '11.15.1-alpha.10')
        assert.equal(versions.get('@h3ravel/console'), '11.15.1-alpha.10')
    })

    it('assigns one minor version to every package in each lane', () => {
        const versions = synchronizedVersions(packages, 'minor')

        assert.equal(versions.get('@h3ravel/core'), '1.30.0-alpha.10')
        assert.equal(versions.get('@h3ravel/contracts'), '1.30.0-alpha.10')
        assert.equal(versions.get('@h3ravel/http'), '11.16.0-alpha.10')
        assert.equal(versions.get('@h3ravel/console'), '11.16.0-alpha.10')
    })

    it('synchronizes each lane and increments its shared alpha version', () => {
        const versions = synchronizedVersions(packages, 'alpha')

        assert.equal(versions.get('@h3ravel/core'), '1.29.0-alpha.11')
        assert.equal(versions.get('@h3ravel/contracts'), '1.29.0-alpha.11')
        assert.equal(versions.get('@h3ravel/http'), '11.15.0-alpha.11')
        assert.equal(versions.get('@h3ravel/console'), '11.15.0-alpha.11')
    })

    it('uses the highest alpha counter in a lane', () => {
        const versions = synchronizedVersions([
            { name: '@h3ravel/core', version: '1.22.0-alpha.8' },
            { name: '@h3ravel/contracts', version: '1.22.0-alpha.12' },
        ], 'alpha')

        assert.deepEqual([...versions.values()], ['1.22.0-alpha.13', '1.22.0-alpha.13'])
    })

    it('advances lower packages by one major and bumps synchronized 11.x packages by one minor', () => {
        const versions = synchronizedVersions(packages, 'major')

        assert.equal(versions.get('@h3ravel/core'), '2.0.0-alpha.10')
        assert.equal(versions.get('@h3ravel/contracts'), '2.0.0-alpha.10')
        assert.equal(versions.get('@h3ravel/http'), '11.16.0-alpha.10')
        assert.equal(versions.get('@h3ravel/console'), '11.16.0-alpha.10')
    })

    it('caps staged major catch-up at 11', () => {
        const versions = synchronizedVersions([
            { name: '@h3ravel/core', version: '10.4.0-alpha.10' },
            { name: '@h3ravel/contracts', version: '9.8.0-alpha.10' },
            { name: '@h3ravel/http', version: '11.8.0-alpha.10' },
        ], 'major')

        assert.equal(versions.get('@h3ravel/core'), '11.0.0-alpha.10')
        assert.equal(versions.get('@h3ravel/contracts'), '11.0.0-alpha.10')
        assert.equal(versions.get('@h3ravel/http'), '11.9.0-alpha.10')
    })

    it('allows a synchronized 11.x workspace to advance together', () => {
        const versions = synchronizedVersions([
            { name: '@h3ravel/core', version: '11.15.1-alpha.10' },
            { name: '@h3ravel/http', version: '11.15.1-alpha.10' },
        ], 'major')

        assert.deepEqual([...versions.values()], ['12.0.0-alpha.10', '12.0.0-alpha.10'])
    })
})

describe('workspace dependency ranges', () => {
    it('preserves the workspace range operator', () => {
        assert.equal(
            updateWorkspaceRange('workspace:^1.22.0-alpha.10', '11.0.0-alpha.10'),
            'workspace:^11.0.0-alpha.10'
        )
    })

    it('updates internal ranges from the complete version plan', () => {
        const plan = buildVersionPlan([
            {
                file: '/core/package.json',
                name: '@h3ravel/core',
                version: '1.22.0-alpha.10',
                json: {
                    name: '@h3ravel/core',
                    version: '1.22.0-alpha.10',
                },
            },
            {
                file: '/events/package.json',
                name: '@h3ravel/events',
                version: '0.1.0-alpha.10',
                json: {
                    name: '@h3ravel/events',
                    version: '0.1.0-alpha.10',
                    peerDependencies: {
                        '@h3ravel/core': 'workspace:^1.22.0-alpha.10',
                    },
                },
            },
            {
                file: '/http/package.json',
                name: '@h3ravel/http',
                version: '11.8.0-alpha.10',
                json: {
                    name: '@h3ravel/http',
                    version: '11.8.0-alpha.10',
                },
            },
        ], 'major')

        const events = plan.find(pkg => pkg.name === '@h3ravel/events')
        assert.equal(events.nextVersion, '2.0.0-alpha.10')
        assert.equal(
            events.json.peerDependencies['@h3ravel/core'],
            'workspace:^2.0.0-alpha.10'
        )
    })
})
