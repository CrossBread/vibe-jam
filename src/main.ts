import { createPong } from './game/pong'

const app = document.getElementById('app')!
const canvas = document.createElement('canvas')
canvas.width = 800
canvas.height = 480
app.appendChild(canvas)

const game = createPong(canvas)
// expose for e2e tests
// @ts-expect-error test hook
window.__pong = game
