import { cp, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const target = path.join(root, 'dist', 'notes')
await mkdir(target, { recursive: true })
await cp(path.join(root, 'docs', 'assets'), path.join(target, 'assets'), { recursive: true })
await cp(path.join(root, 'docs', '产品说明.html'), path.join(target, 'index.html'))
console.log('copied web notes -> dist/notes/')
