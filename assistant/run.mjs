// Assistants-in-Action runner: OpenAI Responses API + tool-calling
// Operates on the local checkout; commit happens in the workflow.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY secret')
  process.exit(1)
}
const GH_BRANCH = process.env.GH_BRANCH || 'master'
const INSTRUCTIONS = process.argv.slice(2).join(' ').trim() || process.env.INSTRUCTIONS || ''
if (!INSTRUCTIONS) {
  console.error('No instructions provided. Pass as CLI arg or set INSTRUCTIONS.')
  process.exit(1)
}

// --- Tools ---
async function repo_list({ path: p = '' } = {}) {
  const base = path.resolve(process.cwd(), p)
  function walk(dir, acc) {
    const items = fs.readdirSync(dir, { withFileTypes: true })
    for (const it of items) {
      const full = path.join(dir, it.name)
      const rel = path.relative(process.cwd(), full).replaceAll('\\', '/')
      if (rel.startsWith('.git')) continue
      if (it.isDirectory()) walk(full, acc)
      else acc.push(rel)
    }
    return acc
  }
  const files = walk(base, [])
  return files.slice(0, 400)
}
async function repo_read({ path: p }) {
  const rel = path.resolve(process.cwd(), p)
  const content = fs.readFileSync(rel, 'utf8')
  return { path: p, content }
}
async function repo_write({ path: p, content, create_dirs = false }) {
  const rel = path.resolve(process.cwd(), p)
  if (create_dirs) fs.mkdirSync(path.dirname(rel), { recursive: true })
  fs.writeFileSync(rel, content, 'utf8')
  return { ok: true, path: p, bytes: content.length }
}
async function repo_commit({ message = 'assistant: update' } = {}) {
  return { ok: true, message }
}

const TOOL_SPEC = [
  { type: 'function', function: { name: 'repo_list', description: 'List files (limit 400)', parameters: { type: 'object', properties: { path: { type: 'string' } } } } },
  { type: 'function', function: { name: 'repo_read', description: 'Read text file', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'repo_write', description: 'Write/replace text file', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' }, create_dirs: { type: 'boolean' } }, required: ['path','content'] } } },
  { type: 'function', function: { name: 'repo_commit', description: 'Signal that changes are ready to commit', parameters: { type: 'object', properties: { message: { type: 'string' } } } } },
]

const SYSTEM_PROMPT = `You are a senior web game engineer editing a TypeScript + Vite canvas game.
Repo structure: game logic in src/game (e.g., src/game/pong.ts). Tests in tests/.
Goal: implement the user's change request safely, and keep or add tests to cover the behavior.
Use tools to inspect and modify the repo. Prefer minimal diffs and passing builds.
When behavior changes, update/extend tests accordingly.
At the end, call repo_commit with a descriptive commit message.`

const messages = [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: INSTRUCTIONS }
]

async function callOpenAI(payload) {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`OpenAI error: ${res.status} ${txt}`)
  }
  return res.json()
}

async function runOnce() {
  let convo = [...messages]
  while (true) {
    const data = await callOpenAI({
      model: 'gpt-5.1-mini',
      input: convo,
      tools: TOOL_SPEC
    })
    const toolCalls = data?.output?.[0]?.content?.filter(c => c.type === 'tool_call')?.map(c => c.tool_call) || []
    const assistantMsg = data.output_text || ''
    if (toolCalls.length === 0) { console.log(assistantMsg); break }

    const toolResponses = []
    for (const call of toolCalls) {
      const name = call.function.name
      const args = call.function.arguments ? JSON.parse(call.function.arguments) : {}
      try {
        let result
        if (name === 'repo_list') result = await repo_list(args)
        else if (name === 'repo_read') result = await repo_read(args)
        else if (name === 'repo_write') result = await repo_write(args)
        else if (name === 'repo_commit') result = await repo_commit(args)
        else result = { error: `Unknown tool: ${name}` }
        toolResponses.push({ role: 'tool', content: JSON.stringify(result), tool_call_id: call.id })
      } catch (e) {
        toolResponses.push({ role: 'tool', content: JSON.stringify({ error: String(e) }), tool_call_id: call.id })
      }
    }
    convo.push({ role: 'assistant', content: assistantMsg })
    convo.push(...toolResponses)
  }
}

runOnce().catch(e => { console.error(e); process.exit(1) })
