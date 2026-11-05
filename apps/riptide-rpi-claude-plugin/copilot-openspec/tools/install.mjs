import { lstat, mkdir, open, readFile, realpath, rmdir, unlink } from 'node:fs/promises'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bundleRoot = join(kitRoot, 'bundle')

export function bundlePaths(manifest) {
	if (manifest.formatVersion !== 1) throw new Error('Could not read manifest. Expected format version 1.')
	const names = [...manifest.coordinators, ...manifest.workers, ...manifest.skills]
	if (!names.every((name) => typeof name === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))) {
		throw new Error('Could not read manifest. Agent and skill names must be lowercase and hyphenated.')
	}
	const paths = [
		...[...manifest.coordinators, ...manifest.workers].map((name) => `.github/agents/${name}.agent.md`),
		...manifest.skills.map((name) => `.github/skills/${name}/SKILL.md`),
		...manifest.supportFiles,
	]
	for (const path of paths) {
		if (typeof path !== 'string' || !path || path.includes('\\') || path.includes(':') ||
			path.startsWith('/') || path.split('/').some((part) => !part || part === '.' || part === '..') ||
			posix.normalize(path) !== path) {
			throw new Error(`Could not read manifest. Unsafe bundle path: ${path}`)
		}
	}
	if (new Set(paths).size !== paths.length) throw new Error('Could not read manifest. Bundle paths must be unique.')
	return paths.sort()
}

async function inspect(path) {
	try {
		return await lstat(path)
	} catch (error) {
		if (error.code === 'ENOENT') return null
		throw error
	}
}

async function safeEntry(root, relative) {
	const parts = relative.split('/')
	let current = root
	for (let index = 0; index < parts.length; index++) {
		current = join(current, parts[index])
		const entry = await inspect(current)
		if (!entry) return null
		if (entry.isSymbolicLink()) throw new Error(`Could not install ${relative}. Symbolic links are not supported.`)
		if (index < parts.length - 1 && !entry.isDirectory()) {
			throw new Error(`Could not install ${relative}. A parent path is not a directory: ${current}`)
		}
		if (index === parts.length - 1) return entry
	}
}

export async function planInstall(targetDirectory) {
	const target = await realpath(resolve(targetDirectory))
	if (!(await lstat(target)).isDirectory()) throw new Error('Could not install files. Select an existing target directory.')
	const manifest = JSON.parse(await readFile(join(kitRoot, 'manifest.json'), 'utf8'))
	const entries = []
	for (const path of bundlePaths(manifest)) {
		const source = await safeEntry(bundleRoot, path)
		if (!source?.isFile()) throw new Error(`Could not read bundle file: ${path}`)
		const data = await readFile(join(bundleRoot, path))
		const existing = await safeEntry(target, path)
		let action = 'create'
		if (existing) {
			if (!existing.isFile()) action = 'conflict'
			else if (path === 'openspec/config.yaml') action = 'preserve-config'
			else if (data.equals(await readFile(join(target, path)))) action = 'unchanged'
			else action = 'conflict'
		}
		entries.push({ path, action, data })
	}
	return { target, entries }
}

async function createParents(root, relative, createdDirectories) {
	let current = root
	for (const part of relative.split('/').slice(0, -1)) {
		current = join(current, part)
		try {
			await mkdir(current)
			createdDirectories.push(current)
		} catch (error) {
			if (error.code !== 'EEXIST') throw error
		}
		const entry = await lstat(current)
		if (entry.isSymbolicLink() || !entry.isDirectory()) {
			throw new Error(`Could not create ${relative}. Parent paths must be regular directories.`)
		}
	}
}

export async function applyInstallPlan(plan) {
	const conflicts = plan.entries.filter((entry) => entry.action === 'conflict')
	if (conflicts.length) {
		throw new Error(`Could not install files. Resolve these conflicts before retrying:\n${conflicts.map((entry) => entry.path).join('\n')}`)
	}
	const createdFiles = []
	const createdDirectories = []
	try {
		for (const entry of plan.entries) {
			if (entry.action !== 'create') continue
			await createParents(plan.target, entry.path, createdDirectories)
			await safeEntry(plan.target, entry.path)
			// Exclusive creation also protects files that appeared after the preflight.
			const handle = await open(join(plan.target, entry.path), 'wx')
			createdFiles.push(entry.path)
			try {
				await handle.writeFile(entry.data)
			} finally {
				await handle.close()
			}
		}
	} catch (error) {
		const cleanupErrors = []
		for (const path of createdFiles.reverse()) {
			try {
				await safeEntry(plan.target, path)
				await unlink(join(plan.target, path))
			} catch (cleanupError) {
				if (cleanupError.code !== 'ENOENT') cleanupErrors.push(cleanupError.message)
			}
		}
		for (const path of createdDirectories.reverse()) {
			try {
				await rmdir(path)
			} catch (cleanupError) {
				if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(cleanupError.code)) cleanupErrors.push(cleanupError.message)
			}
		}
		if (cleanupErrors.length) {
			throw new Error(`Could not complete installation. ${error.message}\nReview partial files before retrying:\n${cleanupErrors.join('\n')}`)
		}
		throw error
	}
	return plan
}

export async function install(targetDirectory, dryRun = false) {
	const plan = await planInstall(targetDirectory)
	if (plan.entries.some((entry) => entry.action === 'conflict')) {
		// Fail before creating any files, including when previewing a conflicting install.
		await applyInstallPlan(plan)
	}
	if (!dryRun) await applyInstallPlan(plan)
	return plan
}

const usage = 'Usage: node tools/install.mjs --target <existing-project-directory> [--dry-run]\nExisting config and identical files are preserved; conflicting files are never overwritten.'

export function parseArguments(args) {
	let target
	let dryRun = false
	if (args.length === 1 && args[0] === '--help') return { help: true }
	for (let index = 0; index < args.length; index++) {
		if (args[index] === '--dry-run' && !dryRun) dryRun = true
		else if (args[index] === '--target' && !target && args[index + 1] && !args[index + 1].startsWith('--')) {
			target = args[++index]
		} else throw new Error(`Could not read arguments. ${usage}`)
	}
	if (!target) throw new Error(`Could not select a target. ${usage}`)
	return { target, dryRun }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	try {
		const args = parseArguments(process.argv.slice(2))
		if (args.help) console.log(usage)
		else {
			const plan = await install(args.target, args.dryRun)
			console.log(`${args.dryRun ? 'Installation preview' : 'Installation complete'}: ${plan.target}`)
			for (const entry of plan.entries) console.log(`${entry.action}: ${entry.path}`)
			console.log('Use openspec new change <name> --schema rpi to select this workflow explicitly.')
			console.log('Review project context and validate the agents in the VS Code Copilot harness before use.')
		}
	} catch (error) {
		console.error(`Could not install the RPI starter kit. ${error.message}`)
		process.exitCode = 1
	}
}
