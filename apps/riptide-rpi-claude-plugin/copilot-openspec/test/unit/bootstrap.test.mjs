import { afterEach, beforeEach, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { kitRoot } from '../../tools/install.mjs'

let root
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'rpi-bootstrap-test-')) })
afterEach(async () => { await rm(root, { recursive: true, force: true }) })

test('integration bootstrap propagates a mismatched CLI version as failure, not a skipped suite', async () => {
	const fake = join(root, 'wrong-version.mjs')
	await writeFile(fake, "console.log('0.0.0')\n")
	const result = spawnSync(process.execPath, [join(kitRoot, 'tools/test-openspec.mjs')], {
		encoding: 'utf8',
		env: { ...process.env, RPI_OPENSPEC_CLI: fake, DO_NOT_TRACK: '1', CI: 'true' },
	})
	expect(result.error).toBeUndefined()
	expect(result.status).toBe(1)
	expect(result.stderr).toContain('1.16.0')
	expect(result.stderr).toContain('0.0.0')
})

test('integration bootstrap propagates a missing explicitly selected CLI as failure', () => {
	const result = spawnSync(process.execPath, [join(kitRoot, 'tools/test-openspec.mjs')], {
		encoding: 'utf8',
		env: { ...process.env, RPI_OPENSPEC_CLI: join(root, 'missing.mjs'), DO_NOT_TRACK: '1', CI: 'true' },
	})
	expect(result.error).toBeUndefined()
	expect(result.status).toBe(1)
})
