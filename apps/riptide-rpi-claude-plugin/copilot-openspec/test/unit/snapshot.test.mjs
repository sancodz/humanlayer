import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { normalizeTasks, snapshot } from '../../bundle/.github/rpi/snapshot.mjs'
import { kitRoot } from '../../tools/install.mjs'

let root
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'rpi-snapshot-test-')) })
afterEach(async () => { await rm(root, { recursive: true, force: true }) })

async function populate() {
	for (const path of ['.openspec.yaml', 'request.md', 'research-questions.md', 'research.md', 'proposal.md', 'design.md', 'plan.md']) {
		await writeFile(join(root, path), `Fixture ${path}\n`)
	}
	await writeFile(join(root, 'tasks.md'), '## 1. Phase 1\n\n- [ ] 1.1 Add behavior; verify its test.\n- [ ] 1.2 Add tests; run the suite.\n')
	await mkdir(join(root, 'specs/auth/session'), { recursive: true })
	await writeFile(join(root, 'specs/auth/session/spec.md'), '## ADDED Requirements\n\nFixture spec\n')
}

describe('planning scope fingerprints', () => {
	test('reports deterministic sorted paths, missing inputs, and spec count without granting approval', async () => {
		const empty = await snapshot(root)
		expect(empty.missing).toHaveLength(8)
		expect(empty.specFileCount).toBe(0)
		expect(empty.approved).toBeUndefined()
		await populate()
		const complete = await snapshot(root)
		expect(complete).toEqual(await snapshot(root))
		expect(complete.scopeDigest).toMatch(/^[a-f0-9]{64}$/)
		expect(complete.files.map((file) => file.path)).toEqual(complete.files.map((file) => file.path).sort())
		expect(complete.files.some((file) => file.path === 'specs/auth/session/spec.md')).toBe(true)
		expect(complete.specFileCount).toBe(1)
		expect(complete.missing).toEqual([])
	})

	test('completion-only edits, including OpenSpec marker variants, retain approved scope', async () => {
		await populate()
		const before = await snapshot(root)
		const path = join(root, 'tasks.md')
		const original = await readFile(path, 'utf8')
		for (const marker of ['[x]', '[X]', '[ x ]', '[~]', '[]']) {
			await writeFile(path, original.replaceAll('[ ]', marker))
			expect((await snapshot(root)).scopeDigest).toBe(before.scopeDigest)
		}
	})

	test('task text or ordering changes invalidate planning scope', async () => {
		await populate()
		const before = await snapshot(root)
		const path = join(root, 'tasks.md')
		const original = await readFile(path, 'utf8')
		await writeFile(path, original.replace('Add behavior', 'Change behavior'))
		expect((await snapshot(root)).scopeDigest).not.toBe(before.scopeDigest)
		await writeFile(path, '- [ ] 1.2 Add tests; run the suite.\n- [ ] 1.1 Add behavior; verify its test.\n')
		expect((await snapshot(root)).scopeDigest).not.toBe(before.scopeDigest)
	})

	test('plan, input, metadata, and spec edits each change scope', async () => {
		await populate()
		for (const path of ['plan.md', 'request.md', '.openspec.yaml', 'specs/auth/session/spec.md']) {
			const before = await snapshot(root)
			await writeFile(join(root, path), `Revised ${path}\n`)
			expect((await snapshot(root)).scopeDigest).not.toBe(before.scopeDigest)
		}
	})

	test('new capability files change scope; records and application code are deliberately not approval inputs', async () => {
		await populate()
		const before = await snapshot(root)
		await writeFile(join(root, 'approvals.md'), 'Actual user review record\n')
		await writeFile(join(root, 'verification.md'), 'Actual checks\n')
		await writeFile(join(root, 'application.mjs'), 'export const changed = true\n')
		expect((await snapshot(root)).scopeDigest).toBe(before.scopeDigest)
		await mkdir(join(root, 'specs/another'))
		await writeFile(join(root, 'specs/another/spec.md'), 'Another scope\n')
		expect((await snapshot(root)).scopeDigest).not.toBe(before.scopeDigest)
	})

	test('normalizes only numbered task progress and preserves other meaningful content', () => {
		expect(normalizeTasks('- [x] 1.1 Done\n- [ ] 1.2 Next\n')).toBe('- [ ] 1.1 Done\n- [ ] 1.2 Next\n')
		expect(normalizeTasks('- [x] approval\nconst a = "[x]"\n')).toBe('- [x] approval\nconst a = "[x]"\n')
	})

	test('does not follow a symlinked artifact or specs tree', async () => {
		await populate()
		await rm(join(root, 'plan.md'))
		await symlink(join(root, 'request.md'), join(root, 'plan.md'))
		await expect(snapshot(root)).rejects.toThrow('symbolic link')
		await rm(join(root, 'plan.md'))
		await writeFile(join(root, 'plan.md'), 'Plan\n')
		await symlink(join(root, 'request.md'), join(root, 'specs/auth/link.md'))
		await expect(snapshot(root)).rejects.toThrow('Symbolic links')
	})

	test('Node CLI emits JSON on success and fails on invalid input', async () => {
		await populate()
		const cli = join(kitRoot, 'bundle/.github/rpi/snapshot.mjs')
		const run = (args) => spawnSync('node', [cli, ...args], { encoding: 'utf8' })
		const result = run([root])
		expect(result.status).toBe(0)
		expect(JSON.parse(result.stdout)).toEqual(await snapshot(root))
		expect(run(['--help']).status).toBe(0)
		expect(run([]).status).toBe(1)
		expect(run([join(root, 'missing')]).status).toBe(1)
	})
})
