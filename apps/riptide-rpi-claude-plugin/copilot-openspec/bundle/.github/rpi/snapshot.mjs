import { createHash } from 'node:crypto'
import { lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const inputs = [
	'.openspec.yaml',
	'request.md',
	'research-questions.md',
	'research.md',
	'proposal.md',
	'design.md',
	'plan.md',
	'tasks.md',
]

async function inspect(path) {
	try {
		return await lstat(path)
	} catch (error) {
		if (error.code === 'ENOENT') return null
		throw error
	}
}

function digest(value) {
	return createHash('sha256').update(value).digest('hex')
}

export function normalizeTasks(content) {
	// Completion is execution state, not a change to the approved N.Y task scope.
	return content.replace(/^(\s*-\s*\[)[^\]\r\n]*(\]\s+\d+\.\d+\s)/gm, '$1 $2')
}

async function specPaths(root, relative = 'specs') {
	const directory = join(root, relative)
	const entry = await inspect(directory)
	if (!entry) return []
	if (entry.isSymbolicLink() || !entry.isDirectory()) {
		throw new Error(`Could not read specs at ${relative}. Use a regular directory, not a symbolic link.`)
	}
	const paths = []
	for (const name of (await readdir(directory)).sort()) {
		const path = `${relative}/${name}`
		const child = await lstat(join(root, path))
		if (child.isSymbolicLink()) throw new Error(`Could not read ${path}. Symbolic links are not supported.`)
		if (child.isDirectory()) paths.push(...(await specPaths(root, path)))
		else if (child.isFile() && name.endsWith('.md')) paths.push(path)
	}
	return paths
}

export async function snapshot(changeDirectory) {
	const root = await realpath(resolve(changeDirectory))
	if (!(await lstat(root)).isDirectory()) throw new Error('Could not read change. Select a directory.')
	const specs = await specPaths(root)
	const files = []
	const missing = []
	for (const path of [...inputs, ...specs].sort()) {
		const entry = await inspect(join(root, path))
		if (!entry) {
			missing.push(path)
			continue
		}
		if (entry.isSymbolicLink() || !entry.isFile()) {
			throw new Error(`Could not read ${path}. Use a regular file, not a symbolic link.`)
		}
		let content = await readFile(join(root, path))
		if (path === 'tasks.md') content = Buffer.from(normalizeTasks(content.toString('utf8')))
		files.push({ path, sha256: digest(content) })
	}
	return { version: 1, scopeDigest: digest(JSON.stringify(files)), files, missing, specFileCount: specs.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const args = process.argv.slice(2)
	if (args.length === 1 && args[0] === '--help') {
		console.log('Usage: node .github/rpi/snapshot.mjs <resolved-change-directory>\nPrint planning scope digests; this does not verify readiness or approval.')
	} else if (args.length !== 1 || args[0].startsWith('--')) {
		console.error('Could not read change. Supply one resolved change directory; use --help for usage.')
		process.exitCode = 1
	} else {
		try {
			console.log(JSON.stringify(await snapshot(args[0]), null, 2))
		} catch (error) {
			console.error(`Could not snapshot planning scope. ${error.message}`)
			process.exitCode = 1
		}
	}
}
