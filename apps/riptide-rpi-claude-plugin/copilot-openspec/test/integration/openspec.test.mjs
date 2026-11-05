import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { install, kitRoot } from '../../tools/install.mjs'
import { snapshot } from '../../bundle/.github/rpi/snapshot.mjs'

const cli = process.env.RPI_OPENSPEC_CLI
const manifest = JSON.parse(await readFile(join(kitRoot, 'manifest.json'), 'utf8'))
const artifactIds = ['research-questions', 'research', 'proposal', 'specs', 'design', 'plan', 'tasks']
let root

beforeAll(() => {
	if (!cli) throw new Error('RPI_OPENSPEC_CLI is required. Run tools/test-openspec.mjs; CLI tests are never silently skipped.')
	const result = spawnSync('node', [cli, '--version'], { encoding: 'utf8', env: { ...process.env, DO_NOT_TRACK: '1', CI: 'true' } })
	expect(result.status).toBe(0)
	expect(result.stdout.trim()).toBe(manifest.openspecVersion)
})
beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'rpi-openspec-test-'))
	await install(root)
})
afterEach(async () => { if (root) await rm(root, { recursive: true, force: true }) })

function invoke(args) {
	return spawnSync('node', [cli, ...args], {
		cwd: root,
		encoding: 'utf8',
		env: {
			...process.env,
			DO_NOT_TRACK: '1',
			OPENSPEC_TELEMETRY: '0',
			CI: 'true',
			XDG_CONFIG_HOME: join(root, '.test-config'),
			XDG_DATA_HOME: join(root, '.test-data'),
		},
	})
}

function successful(args, json = true) {
	const result = invoke(args)
	if (result.status !== 0) throw new Error(`openspec ${args.join(' ')} exited ${result.status}\n${result.stdout}\n${result.stderr}`)
	return json ? JSON.parse(result.stdout) : result.stdout
}

function create(name = 'session-expiry') {
	return successful(['new', 'change', name, '--schema', 'rpi', '--json']).change
}
function status(name = 'session-expiry') {
	return successful(['status', '--change', name, '--json'])
}
function instructions(id, name = 'session-expiry') {
	return successful(['instructions', id, '--change', name, '--json'])
}

const questions = '# Research questions\n\n1. How is a session currently considered valid?\n2. Which tests cover expiry and boundary conditions?\n'
const tasks = '## 1. Phase 1: Reject older sessions\n\n- [ ] 1.1 Implement rejection of older expiries; verify the expired-session test.\n- [ ] 1.2 Retain valid-session behavior; verify the regression test.\n\n## 2. Phase 2: Reject the exact expiry boundary\n\n- [ ] 2.1 Reject the boundary timestamp; verify the boundary scenario test.\n- [ ] 2.2 Run the integrated scenario suite; verify all cases pass.\n'
const proposal = '## Why\n\nCallers need consistent session expiration behavior in this isolated synthetic fixture.\n\n## What Changes\n\n- Reject expired sessions, including the exact expiry boundary.\n\n## Capabilities\n\n### New Capabilities\n\n- `session-expiry`: Session validation at and after expiry.\n\n### Modified Capabilities\n\nNone.\n\n## Impact\n\nOnly the temporary fixture module and its tests.\n'
const delta = '## Purpose\n\nDefine when a session is expired so callers can reliably recognize expired credentials and request authentication.\n\n## ADDED Requirements\n\n### Requirement: Expired sessions are rejected\nThe system SHALL reject a session whose expiry time is at or before the current time.\n\n#### Scenario: A session expired before the current time\n- **WHEN** validation receives an expiry earlier than the current time\n- **THEN** validation returns false\n\n#### Scenario: A session is at the expiry boundary\n- **WHEN** validation receives an expiry equal to the current time\n- **THEN** validation returns false\n'

async function populate(change, includeSpecs = true) {
	const artifacts = {
		'request.md': '# Synthetic fixture request\n\nReject expired sessions and the exact expiry boundary.\n',
		'research-questions.md': questions,
		'research.md': '# Synthetic current-state fixture\n\nThe initial session.mjs fixture returns true. The fixture tests exercise session validation. This content is test data, not an agent-generated research result.\n',
		'proposal.md': includeSpecs ? proposal : '## Why\n\nClarify internal fixture documentation without changing system behavior.\n\n## What Changes\n\n- Clarify tooling documentation only.\n\n## Capabilities\n\nNo new or modified capabilities; no spec-level behavior changes.\n\n## Impact\n\nDocumentation only.\n',
		'design.md': '# Synthetic design fixture\n\n## Approach\n\nKeep the public function and test observable expiry behavior.\n\n## Open questions\n\nNone for this CLI fixture. This is not a user approval record.\n',
		'plan.md': '# Synthetic plan fixture\n\n## Phase 1: Reject older sessions\n\nImplement the first vertical behavior and its valid/expired tests. Run `node --test session.test.mjs`. Stop for human review.\n\n## Phase 2: Reject exact expiry\n\nExtend the same path for the boundary case and its regression test. Run `node --test session.test.mjs`. Stop for human review.\n',
		'tasks.md': tasks,
	}
	for (const [path, content] of Object.entries(artifacts)) await writeFile(join(change.path, path), content)
	if (includeSpecs) {
		await mkdir(join(change.path, 'specs/session-expiry'), { recursive: true })
		await writeFile(join(change.path, 'specs/session-expiry/spec.md'), delta)
	}
}

function checkFixture() {
	return spawnSync('node', ['--test', 'session.test.mjs'], { cwd: root, encoding: 'utf8' })
}

describe('OpenSpec 1.16.0 integration with the installed kit', () => {
	test('the shipped schema validates and resolves from the project', () => {
		expect(successful(['schema', 'validate', 'rpi'], false)).toContain('valid')
		expect(successful(['schema', 'which', 'rpi'], false)).toContain('project')
	})

	test('new changes start with only research questions ready', () => {
		const change = create()
		const initial = status()
		expect(change.schema).toBe('rpi')
		expect(initial.changeRoot).toBe(change.path)
		expect(initial.isPlanningComplete).toBe(false)
		expect(initial.artifacts.filter((artifact) => artifact.status === 'ready').map((artifact) => artifact.id)).toEqual(['research-questions'])
		expect(initial.artifacts.map((artifact) => artifact.id)).toEqual(artifactIds)
	})

	test('every artifact instruction returns its actual shipped template and resolved path', async () => {
		create()
		for (const id of artifactIds) {
			const result = instructions(id)
			const templateName = id === 'specs' ? 'spec' : id
			expect(result.schemaName).toBe('rpi')
			expect(result.artifactId).toBe(id)
			expect(result.template).toBe(await readFile(join(root, `openspec/schemas/rpi/templates/${templateName}.md`), 'utf8'))
			expect(result.resolvedOutputPath.startsWith(join(root, 'openspec/changes/session-expiry/'))).toBe(true)
		}
	})

	test('research depends only on descriptive questions and does not include request content', async () => {
		const change = create()
		await writeFile(join(change.path, 'request.md'), 'INTENT_SENTINEL_DO_NOT_FEED_TO_RESEARCH\n')
		await writeFile(join(change.path, 'research-questions.md'), questions)
		const research = instructions('research')
		expect(research.dependencies.map((dependency) => dependency.id)).toEqual(['research-questions'])
		expect(research.dependencies[0].done).toBe(true)
		expect(research.resolvedOutputPath).toBe(join(change.path, 'research.md'))
		expect(JSON.stringify(research)).not.toContain('INTENT_SENTINEL_DO_NOT_FEED_TO_RESEARCH')
		expect(status().artifacts.find((artifact) => artifact.id === 'research').status).toBe('ready')
	})

	test('premature tasks do not bypass any of the other required planning artifacts', async () => {
		const change = create()
		await writeFile(join(change.path, 'tasks.md'), tasks)
		const apply = instructions('apply')
		expect(apply.state).toBe('blocked')
		expect(new Set(apply.missingArtifacts)).toEqual(new Set(artifactIds.filter((id) => id !== 'tasks')))
	})

	test('complete planning enables apply but does not imply implementation or approval', async () => {
		const change = create()
		await populate(change)
		const planned = status()
		const apply = instructions('apply')
		expect(planned.isPlanningComplete).toBe(true)
		expect(planned.isComplete).toBe(true)
		expect(apply.state).toBe('ready')
		expect(apply.progress).toEqual({ total: 4, complete: 0, remaining: 4 })
		expect(apply.contextFiles.plan).toEqual([join(change.path, 'plan.md')])
		expect((await readdir(change.path)).includes('approvals.md')).toBe(false)
		successful(['validate', 'session-expiry', '--type', 'change', '--strict', '--no-interactive'], false)
	})

	test('strict validation rejects an incorrectly headed scenario', async () => {
		const change = create()
		await populate(change)
		await writeFile(join(change.path, 'specs/session-expiry/spec.md'), delta.replaceAll('#### Scenario:', '### Scenario:'))
		const invalid = invoke(['validate', 'session-expiry', '--type', 'change', '--strict', '--no-interactive'])
		expect(invalid.status).toBe(1)
		expect(`${invalid.stdout}\n${invalid.stderr}`).toContain('scenario')
	})

	test('two phases run real fixture checks and track progress separately from planning/acceptance', async () => {
		const change = create()
		await populate(change)
		const scope = await snapshot(change.path)
		await writeFile(join(root, 'session.mjs'), 'export function isSessionValid() { return true }\n')
		await writeFile(join(root, 'session.test.mjs'), "import { test } from 'node:test'\nimport assert from 'node:assert/strict'\nimport { isSessionValid } from './session.mjs'\ntest('rejects an older expiry', () => assert.equal(isSessionValid(9, 10), false))\ntest('retains valid sessions', () => assert.equal(isSessionValid(11, 10), true))\n")
		expect(checkFixture().status).toBe(1)
		await writeFile(join(root, 'session.mjs'), 'export function isSessionValid(expiresAt, now) { return expiresAt >= now }\n')
		expect(checkFixture().status).toBe(0)
		let progress = tasks.replace('- [ ] 1.1', '- [x] 1.1').replace('- [ ] 1.2', '- [x] 1.2')
		await writeFile(join(change.path, 'tasks.md'), progress)
		expect(instructions('apply').progress).toEqual({ total: 4, complete: 2, remaining: 2 })
		expect(status().isPlanningComplete).toBe(true)
		expect((await snapshot(change.path)).scopeDigest).toBe(scope.scopeDigest)

		const firstTests = await readFile(join(root, 'session.test.mjs'), 'utf8')
		await writeFile(join(root, 'session.test.mjs'), firstTests + "test('rejects the exact boundary', () => assert.equal(isSessionValid(10, 10), false))\n")
		expect(checkFixture().status).toBe(1)
		await writeFile(join(root, 'session.mjs'), 'export function isSessionValid(expiresAt, now) { return expiresAt > now }\n')
		expect(checkFixture().status).toBe(0)
		progress = progress.replaceAll('- [ ]', '- [x]')
		await writeFile(join(change.path, 'tasks.md'), progress)
		expect(instructions('apply').state).toBe('all_done')
		expect(instructions('apply').progress).toEqual({ total: 4, complete: 4, remaining: 0 })
		expect((await snapshot(change.path)).scopeDigest).toBe(scope.scopeDigest)
		expect((await readdir(change.path)).includes('approvals.md')).toBe(false)
		successful(['validate', 'session-expiry', '--type', 'change', '--strict', '--no-interactive'], false)
	})

	test('a deliberate spec skip satisfies the graph without invented requirements', async () => {
		const change = create('docs-only')
		await populate(change, false)
		const metadata = await readFile(change.metadataPath, 'utf8')
		expect(Bun.YAML.parse(metadata).skip_specs).toBeUndefined()
		await writeFile(change.metadataPath, metadata + '\nskip_specs: true\n')
		const skipped = status('docs-only')
		expect(skipped.artifacts.find((artifact) => artifact.id === 'specs').status).toBe('skipped')
		expect(skipped.isPlanningComplete).toBe(true)
		expect(instructions('specs', 'docs-only').skipped).toBe(true)
		expect(instructions('apply', 'docs-only').state).toBe('ready')
		expect(instructions('apply', 'docs-only').contextFiles.specs ?? []).toEqual([])
		successful(['validate', 'docs-only', '--type', 'change', '--strict', '--no-interactive'], false)
	})

	test('a preserved spec-driven config still supports explicitly selected rpi changes', async () => {
		const config = 'schema: spec-driven\ncontext: |\n  Follow the example project conventions.\n'
		await writeFile(join(root, 'openspec/config.yaml'), config)
		await install(root)
		create()
		expect(status().schemaName).toBe('rpi')
		expect(await readFile(join(root, 'openspec/config.yaml'), 'utf8')).toBe(config)
		expect(instructions('research').context).toContain('example project conventions')
	})

	test('official Copilot init/update coexist with custom RPI files without creating cloud automation', async () => {
		const plan = await install(root)
		successful(['init', '--tools', 'github-copilot', '--no-copilot-cloud'], false)
		successful(['update'], false)
		for (const entry of plan.entries) {
			if (entry.path === 'openspec/config.yaml') continue // Official init may record its own integration selection.
			expect(await readFile(join(root, entry.path))).toEqual(entry.data)
		}
		const skills = await readdir(join(root, '.github/skills'))
		expect(skills).toContain('rpi-research')
		expect(skills.some((name) => name.startsWith('openspec-'))).toBe(true)
		expect(existsSync(join(root, '.github/workflows/copilot-setup-steps.yml'))).toBe(false)
		create()
		expect(status().schemaName).toBe('rpi')
	})

	test('two active changes keep their state independent and unknown lookups fail without creating a change', async () => {
		const first = create('first-change')
		create('second-change')
		await writeFile(join(first.path, 'research-questions.md'), questions)
		expect(status('first-change').artifacts.find((artifact) => artifact.id === 'research').status).toBe('ready')
		expect(status('second-change').artifacts.find((artifact) => artifact.id === 'research').status).toBe('blocked')
		expect(invoke(['status', '--change', 'missing-change', '--json']).status).toBe(1)
		expect(invoke(['instructions', 'apply', '--change', 'missing-change', '--json']).status).toBe(1)
		expect((await readdir(join(root, 'openspec/changes'))).filter((name) => name !== 'archive').sort()).toEqual(['first-change', 'second-change'])
	})

	test('missing earlier artifacts re-block apply even after every task was checked', async () => {
		const change = create()
		await populate(change)
		await writeFile(join(change.path, 'tasks.md'), tasks.replaceAll('- [ ]', '- [x]'))
		expect(instructions('apply').state).toBe('all_done')
		await rm(join(change.path, 'research.md'))
		expect(status().isPlanningComplete).toBe(false)
		const apply = instructions('apply')
		expect(apply.state).toBe('blocked')
		expect(apply.missingArtifacts).toContain('research')
	})
})
