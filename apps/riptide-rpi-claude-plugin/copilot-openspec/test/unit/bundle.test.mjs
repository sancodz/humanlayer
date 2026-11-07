import { describe, expect, test } from 'bun:test'
import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { bundlePaths, kitRoot } from '../../tools/install.mjs'

const bundle = join(kitRoot, 'bundle')
const manifest = JSON.parse(await readFile(join(kitRoot, 'manifest.json'), 'utf8'))
const artifacts = ['research-questions', 'research', 'proposal', 'specs', 'design', 'plan', 'tasks']
const schema = Bun.YAML.parse(await readFile(join(bundle, 'openspec/schemas/rpi/schema.yaml'), 'utf8'))

async function filesUnder(directory, prefix = '') {
	const files = []
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name
		if (entry.isDirectory()) files.push(...(await filesUnder(join(directory, entry.name), relative)))
		else files.push(relative)
	}
	return files.sort()
}

function frontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n/)
	expect(match).not.toBeNull()
	return Bun.YAML.parse(match[1])
}

const workerTools = {
	'codebase-locator': ['read', 'search'],
	'codebase-analyzer': ['read', 'search'],
	'codebase-pattern-finder': ['read', 'search'],
	'web-search-researcher': ['read', 'search', 'web'],
	'implementer-agent': ['read', 'search', 'edit', 'execute'],
	'implementation-reviewer': ['read', 'search'],
}
const skillRoles = {
	'rpi-questions': 'rpi-intake',
	'rpi-research': 'rpi-researcher',
	'rpi-design': 'rpi-planner',
	'rpi-plan': 'rpi-planner',
	'rpi-implement': 'rpi-implementer',
	'rpi-verify': 'rpi-implementer',
}

describe('portable bundle contract', () => {
	test('manifest includes every shipped file, including hidden files and attribution', async () => {
		expect(await filesUnder(bundle)).toEqual(bundlePaths(manifest))
		expect(manifest.coordinators).toHaveLength(4)
		expect(manifest.workers).toHaveLength(6)
		expect(manifest.skills).toHaveLength(6)
		expect(manifest.openspecVersion).toBe('1.16.0')
		expect(bundlePaths(manifest)).toContain('.github/rpi/LICENSE')
		expect(bundlePaths(manifest)).toContain('.github/rpi/NOTICE')
	})

	test('schema owns seven templates and the approved acyclic dependency graph', async () => {
		expect(schema.name).toBe('rpi')
		expect(schema.version).toBe(1)
		expect(schema.artifacts.map((artifact) => artifact.id)).toEqual(artifacts)
		expect(schema.artifacts.find((artifact) => artifact.id === 'research').requires).toEqual(['research-questions'])
		expect(schema.artifacts.find((artifact) => artifact.id === 'specs').generates).toBe('specs/**/*.md')
		expect(schema.apply.requires).toEqual(artifacts)
		expect(schema.apply.tracks).toBe('tasks.md')
		const visited = new Set()
		for (const artifact of schema.artifacts) {
			for (const dependency of artifact.requires) expect(visited.has(dependency)).toBe(true)
			visited.add(artifact.id)
			const template = await readFile(join(bundle, 'openspec/schemas/rpi/templates', artifact.template), 'utf8')
			expect(template.trim().length).toBeGreaterThan(100)
			expect(artifact.instruction.length).toBeGreaterThan(40)
		}
		expect(Bun.YAML.parse(await readFile(join(bundle, 'openspec/config.yaml'), 'utf8')).schema).toBe(schema.name)
	})

	for (const name of [...manifest.coordinators, ...manifest.workers]) {
		test(`${name} uses the Copilot profile with appropriate tool boundaries`, async () => {
			const content = await readFile(join(bundle, `.github/agents/${name}.agent.md`), 'utf8')
			const header = frontmatter(content)
			expect(header.name).toBe(name)
			expect(header.target).toBe('github-copilot')
			expect(header.description.length).toBeGreaterThan(20)
			expect(header.model).toBeUndefined()
			expect(header.agents).toBeUndefined()
			expect(header.handoffs).toBeUndefined()
			expect(header.infer).toBeUndefined()
			expect(new Set(header.tools).size).toBe(header.tools.length)
			if (manifest.workers.includes(name)) {
				expect(header['user-invocable']).toBe(false)
				expect(header['disable-model-invocation']).toBe(false)
				expect(header.tools).toEqual(workerTools[name])
				expect(header.tools).not.toContain('agent')
			} else {
				expect(header['user-invocable']).not.toBe(false)
				expect(header.tools).toEqual(name === 'rpi-intake'
					? ['read', 'search', 'edit', 'execute']
					: ['read', 'search', 'edit', 'execute', 'agent'])
				expect(content).toContain('../rpi/workflow.md')
			}
		})
	}

	for (const name of manifest.skills) {
		test(`${name} is explicit-only and names its designated coordinator and shared contract`, async () => {
			const content = await readFile(join(bundle, `.github/skills/${name}/SKILL.md`), 'utf8')
			const header = frontmatter(content)
			expect(header.name).toBe(name)
			expect(header.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
			expect(header.name.length).toBeLessThanOrEqual(64)
			expect(header.description.length).toBeGreaterThan(20)
			expect(header.description.length).toBeLessThanOrEqual(1024)
			expect(header['disable-model-invocation']).toBe(true)
			expect(header['user-invocable']).not.toBe(false)
			expect(content).toContain(skillRoles[name])
			expect(content).toContain('../../rpi/workflow.md')
			expect(content).toContain('../../rpi/records.md')
		})
	}

	test('template contracts keep research factual, design open, phases vertical, and tasks canonical', async () => {
		const template = (name) => readFile(join(bundle, `openspec/schemas/rpi/templates/${name}.md`), 'utf8')
		expect(await template('research')).toContain('## Open factual questions')
		expect(await template('research')).toContain('#### Existing testing patterns')
		expect(await template('design')).toContain('## Design questions')
		expect(await template('design')).toContain('Only actual user feedback resolves them')
		expect(await template('plan')).toContain('## Phase 1:')
		expect(await template('plan')).toContain('### Automated verification')
		expect(await template('plan')).not.toMatch(/^- \[[ xX]\]/m)
		const tasks = await template('tasks')
		const taskIds = [...tasks.matchAll(/^- \[ \] (\d+\.\d+) /gm)].map((match) => match[1])
		expect(taskIds).toEqual(['1.1', '1.2', '2.1', '2.2'])
		expect((await template('spec')).match(/^#### Scenario:/gm)).toHaveLength(1)
	})

	test('execution guides are shipped and explicitly linked by their consumers', async () => {
		const consumers = {
			'research-guide.md': [
				'.github/agents/rpi-researcher.agent.md',
				'.github/agents/codebase-locator.agent.md',
				'.github/agents/codebase-analyzer.agent.md',
				'.github/agents/codebase-pattern-finder.agent.md',
				'.github/skills/rpi-research/SKILL.md',
			],
			'web-research.md': ['.github/agents/web-search-researcher.agent.md', '.github/rpi/research-guide.md'],
			'planning-guide.md': ['.github/agents/rpi-planner.agent.md', '.github/skills/rpi-plan/SKILL.md'],
			'implementation-guide.md': [
				'.github/agents/rpi-implementer.agent.md',
				'.github/agents/implementer-agent.agent.md',
				'.github/skills/rpi-implement/SKILL.md',
			],
		}
		for (const [guide, paths] of Object.entries(consumers)) {
			expect(manifest.supportFiles).toContain(`.github/rpi/${guide}`)
			for (const path of paths) expect(await readFile(join(bundle, path), 'utf8')).toContain(guide)
		}
	})

	test('research instructions require a deep explainer, not an answer list or file index', async () => {
		const guide = await readFile(join(bundle, '.github/rpi/research-guide.md'), 'utf8')
		expect(guide).toContain('not a question-by-question answer list or a file index')
		expect(guide).toContain('takeaway headers')
		expect(guide).toContain('Verify every source citation')
		expect(guide).toContain('exhaustive or illustrative')
		expect(guide).toContain('testing patterns')
		expect(guide).toContain('2–6')
		expect(guide).toContain('one additional focused pass')
		expect(schema.artifacts.find((artifact) => artifact.id === 'research').instruction).toContain('self-contained technical explainer')
		expect(await readFile(join(bundle, 'openspec/schemas/rpi/templates/research.md'), 'utf8')).toContain('self-contained')
	})

	test('planning derives its outline internally and requires concrete sketches and tests', async () => {
		const skill = await readFile(join(bundle, '.github/skills/rpi-plan/SKILL.md'), 'utf8')
		const guide = await readFile(join(bundle, '.github/rpi/planning-guide.md'), 'utf8')
		const template = await readFile(join(bundle, 'openspec/schemas/rpi/templates/plan.md'), 'utf8')
		const instruction = schema.artifacts.find((artifact) => artifact.id === 'plan').instruction
		expect(skill).not.toContain('incorporate the structural outline')
		expect(skill).toContain('inside `plan.md`')
		expect(guide).toContain('no separate structure-outline artifact or prerequisite')
		expect(guide).toContain('every material code or contract change')
		expect(guide).toContain('concrete test cases or skeletons')
		expect(instruction).toContain('code/contract sketch')
		expect(template).toContain('### Concrete changes')
		expect(template).toContain('### Test detail')
		expect(template).toContain('required concrete code/contract sketch')
	})

	test('revision feedback is inventoried, verified, and integrated without authorizing code', async () => {
		const procedure = await readFile(join(bundle, '.github/rpi/artifact-procedure.md'), 'utf8')
		expect(procedure).toContain('## Revision checklist')
		expect(procedure).toContain('each requested correction/addition')
		expect(procedure).toContain('Verify factual corrections against source')
		expect(procedure).toContain('rather than appending a changelog')
		expect(procedure).toContain('newly surfaced material questions')
		expect(procedure).toContain('Planning feedback never authorizes code')
		for (const skill of ['rpi-research', 'rpi-design', 'rpi-plan']) {
			expect(await readFile(join(bundle, `.github/skills/${skill}/SKILL.md`), 'utf8')).toContain('revision checklist')
		}
	})

	test('debugging is evidence-driven and bounded by approved scope', async () => {
		const guide = await readFile(join(bundle, '.github/rpi/implementation-guide.md'), 'utf8')
		expect(guide).toContain('Reproduce and capture evidence')
		expect(guide).toContain('local logs')
		expect(guide).toContain('read-only database/service diagnostics')
		expect(guide).toContain('within the approved scope')
		expect(guide).toContain('Rerun the failed check')
		expect(guide).toContain('multiple material approaches')
		expect(await readFile(join(bundle, '.github/skills/rpi-implement/SKILL.md'), 'utf8')).toContain('bounded diagnosis')
	})

	test('web research has a bounded search/fetch strategy without shell tooling', async () => {
		const guide = await readFile(join(bundle, '.github/rpi/web-research.md'), 'utf8')
		expect(guide).toContain('2–3')
		expect(guide).toContain('3–5')
		expect(guide).toContain('Refine once')
		expect(guide).toContain('exact URLs')
		expect(guide).toContain('pinned version')
		expect(guide).not.toMatch(/\bcurl\b|\bBash\b/)
	})

	test('local Markdown references resolve and the bundle has no Claude runtime dependencies', async () => {
		for (const path of bundlePaths(manifest).filter((path) => path.endsWith('.md'))) {
			const content = await readFile(join(bundle, path), 'utf8')
			for (const match of content.matchAll(/\]\((\.\.?\/[^)#]+)(?:#[^)]*)?\)/g)) {
				expect((await stat(resolve(dirname(join(bundle, path)), match[1]))).isFile()).toBe(true)
			}
			expect(content).not.toMatch(/\{SKILLBASE\}|mcp__humanlayer__|subagent_type\s*[:=]|\.humanlayer\/tasks\//)
		}
	})
})
