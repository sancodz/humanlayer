import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyInstallPlan, bundlePaths, install, kitRoot, parseArguments, planInstall } from '../../tools/install.mjs'

let root
let target
beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'rpi-install-test-'))
	target = join(root, 'project with spaces')
	await mkdir(target)
})
afterEach(async () => { await rm(root, { recursive: true, force: true }) })

describe('no-clobber installer', () => {
	test('copies the entire manifest including hidden files and preserves bytes', async () => {
		const plan = await install(target)
		for (const entry of plan.entries) {
			expect(await readFile(join(target, entry.path))).toEqual(entry.data)
		}
		expect(plan.entries.every((entry) => entry.action === 'create')).toBe(true)
	})

	test('dry-run has no filesystem side effects', async () => {
		const plan = await install(target, true)
		expect(plan.entries.length).toBeGreaterThan(25)
		expect(await readdir(target)).toEqual([])
	})

	test('preserves an existing config and unrelated project files byte-for-byte', async () => {
		await mkdir(join(target, 'openspec'))
		const config = '# user context\nschema: spec-driven\ncontext: |\n  Preserve this project.\n'
		await writeFile(join(target, 'openspec/config.yaml'), config)
		await writeFile(join(target, 'AGENTS.md'), 'User instructions\n')
		await writeFile(join(target, 'notes.md'), 'Unrelated work\n')
		const plan = await install(target)
		expect(plan.entries.find((entry) => entry.path === 'openspec/config.yaml').action).toBe('preserve-config')
		expect(await readFile(join(target, 'openspec/config.yaml'), 'utf8')).toBe(config)
		expect(await readFile(join(target, 'AGENTS.md'), 'utf8')).toBe('User instructions\n')
		expect(await readFile(join(target, 'notes.md'), 'utf8')).toBe('Unrelated work\n')
	})

	test('reinstall is idempotent', async () => {
		await install(target)
		const plan = await install(target)
		expect(plan.entries.every((entry) => ['unchanged', 'preserve-config'].includes(entry.action))).toBe(true)
	})

	test('a differing owned file aborts before creating any other files', async () => {
		await mkdir(join(target, '.github/agents'), { recursive: true })
		const path = '.github/agents/rpi-researcher.agent.md'
		await writeFile(join(target, path), 'Keep my customization\n')
		await expect(install(target)).rejects.toThrow('Resolve these conflicts')
		await expect(install(target, true)).rejects.toThrow('Resolve these conflicts')
		expect(await readFile(join(target, path), 'utf8')).toBe('Keep my customization\n')
		expect(await readdir(target)).toEqual(['.github'])
		expect(await readdir(join(target, '.github/agents'))).toEqual(['rpi-researcher.agent.md'])
	})

	test('a directory at an owned file path is a conflict, even for config', async () => {
		await mkdir(join(target, 'openspec/config.yaml'), { recursive: true })
		await expect(install(target)).rejects.toThrow('Resolve these conflicts')
		expect(await readdir(target)).toEqual(['openspec'])
	})

	test('a file at a parent directory path aborts without writing', async () => {
		await writeFile(join(target, '.github'), 'not a directory')
		await expect(install(target)).rejects.toThrow('parent path is not a directory')
		expect(await readdir(target)).toEqual(['.github'])
	})

	test('rejects symlinked parent paths without touching the destination', async () => {
		const outside = join(root, 'outside')
		await mkdir(outside)
		await symlink(outside, join(target, '.github'), 'dir')
		await expect(install(target)).rejects.toThrow('Symbolic links')
		expect(await readdir(outside)).toEqual([])
		expect(await readdir(target)).toEqual(['.github'])
	})

	test('rejects a symlinked config rather than following or replacing it', async () => {
		await mkdir(join(target, 'openspec'))
		const outside = join(root, 'external-config.yaml')
		await writeFile(outside, 'schema: custom\n')
		await symlink(outside, join(target, 'openspec/config.yaml'))
		await expect(install(target)).rejects.toThrow('Symbolic links')
		expect(await readFile(outside, 'utf8')).toBe('schema: custom\n')
	})

	test('exclusive creation protects a file appearing after preflight and rolls back earlier copies', async () => {
		const plan = await planInstall(target)
		const raced = plan.entries[1]
		await mkdir(join(target, '.github/agents'), { recursive: true })
		await writeFile(join(target, raced.path), 'appeared after preflight')
		await expect(applyInstallPlan(plan)).rejects.toThrow('EEXIST')
		expect(await readFile(join(target, raced.path), 'utf8')).toBe('appeared after preflight')
		expect(await readdir(join(target, '.github/agents'))).toEqual([raced.path.split('/').at(-1)])
		expect(await readdir(target)).toEqual(['.github'])
	})

	test('requires an existing target and does not create it implicitly', async () => {
		await expect(install(join(root, 'missing'))).rejects.toThrow()
		expect(await readdir(root)).toEqual(['project with spaces'])
	})

	test('rejects malformed paths and duplicate inventory entries', async () => {
		const manifest = JSON.parse(await readFile(join(kitRoot, 'manifest.json'), 'utf8'))
		for (const path of ['../escape', '/absolute', 'C:/absolute', 'a\\b', 'a/../b', './a', 'a//b']) {
			expect(() => bundlePaths({ ...manifest, supportFiles: [path] })).toThrow('Unsafe bundle path')
		}
		expect(() => bundlePaths({ ...manifest, supportFiles: ['openspec/config.yaml', 'openspec/config.yaml'] })).toThrow('unique')
		expect(() => bundlePaths({ ...manifest, coordinators: ['rpi:bad'] })).toThrow('hyphenated')
		expect(() => bundlePaths({ ...manifest, formatVersion: 2 })).toThrow('version 1')
	})

	test('parses explicit CLI arguments and rejects ambiguous, force, or missing options', () => {
		expect(parseArguments(['--target', target, '--dry-run'])).toEqual({ target, dryRun: true })
		expect(parseArguments(['--dry-run', '--target', target])).toEqual({ target, dryRun: true })
		expect(parseArguments(['--help'])).toEqual({ help: true })
		for (const args of [[], ['--target'], ['--target', '--dry-run'], ['--force'], ['--target', target, '--target', target], ['--target', target, '--dry-run', '--dry-run']]) {
			expect(() => parseArguments(args)).toThrow()
		}
	})

	test('Node CLI help/dry-run succeed and conflicts return a nonzero exit', async () => {
		const cli = join(kitRoot, 'tools/install.mjs')
		const run = (args) => spawnSync('node', [cli, ...args], { encoding: 'utf8' })
		expect(run(['--help']).status).toBe(0)
		expect(run([]).status).toBe(1)
		expect(run(['--target', target, '--dry-run']).status).toBe(0)
		expect(await readdir(target)).toEqual([])
		await mkdir(join(target, '.github/agents'), { recursive: true })
		await writeFile(join(target, '.github/agents/codebase-analyzer.agent.md'), 'custom')
		const conflict = run(['--target', target])
		expect(conflict.status).toBe(1)
		expect(conflict.stderr).toContain('Resolve these conflicts')
	})
})
