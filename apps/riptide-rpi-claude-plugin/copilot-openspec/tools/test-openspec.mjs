import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const kit = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(kit, 'manifest.json'), 'utf8'))
const bun = process.versions.bun ? process.execPath : 'bun'
let temporaryInstall

function run(command, args, env = process.env) {
	const result = spawnSync(command, args, { stdio: 'inherit', env })
	if (result.error) throw result.error
	return result.status ?? 1
}

try {
	let cli = process.env.RPI_OPENSPEC_CLI
	if (!cli) {
		temporaryInstall = await mkdtemp(join(tmpdir(), 'rpi-openspec-install-'))
		await writeFile(join(temporaryInstall, 'package.json'), JSON.stringify({
			name: 'rpi-openspec-isolated-tests',
			private: true,
			devDependencies: { '@fission-ai/openspec': manifest.openspecVersion },
		}))
		const code = run(bun, ['install', '--cwd', temporaryInstall, '--ignore-scripts'], {
			...process.env, DO_NOT_TRACK: '1', CI: 'true',
		})
		if (code !== 0) throw new Error(`Could not install the test CLI. Bun exited with code ${code}.`)
		cli = join(temporaryInstall, 'node_modules/@fission-ai/openspec/bin/openspec.js')
	}
	process.exitCode = run(bun, ['test', '--timeout', '30000', join(kit, 'test/integration')], {
		...process.env, RPI_OPENSPEC_CLI: resolve(cli), DO_NOT_TRACK: '1', CI: 'true',
	})
} catch (error) {
	console.error(`Could not run OpenSpec integration tests. ${error.message}`)
	process.exitCode = 1
} finally {
	if (temporaryInstall) await rm(temporaryInstall, { recursive: true, force: true })
}
