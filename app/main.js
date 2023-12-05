const API_URL = 'http://localhost:3000'

async function consumeAPI (signal) {
  const res = await fetch(API_URL, { signal })
  const reader = res.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
  return reader
}

function parseNDJSON () {
  return new TransformStream({
    transform (chunk, controller) {
      for (const line of chunk.split('\n')) {
        if (!line.length) continue
        try {
          controller.enqueue(JSON.parse(line))
        } catch (error) {
          // TODO: implement case where single chunk has partial data
        }
      }
    }
  })
}

let totalCards = 0
let rafId = null
let drawing = false
let ops = 0

function appendToHtml (element, counterLabel) {
  let counter = 0
  let batchHtml = ''
  drawing = true
  ops = 0
  function drawTable () {
    element.innerHTML = batchHtml
    if (drawing) rafId = window.requestAnimationFrame(drawTable)
  }

  const interval = setInterval(() => {
    counterLabel.innerHTML = ops
    ops = 0
  }, 1000)

  window.requestAnimationFrame(drawTable)

  return new WritableStream({
    write ({ title, description }) {
      const card = `
      <article>
        <div>
          <h3>[${++counter}] ${title}</h3>
          <p>${description.slice(0, 100)}</p>
          <a href="#">Here's why</a>
        </div>
      </article>
      `
      if (totalCards >= 24) {
        totalCards = 0
        batchHtml = ''
      }
      totalCards++
      ops++
      batchHtml += card
    },
    abort (reason) {
      console.log('aborted*', reason)
      clearInterval(interval)
    }
  })
}

const [start, stop, counterLabel, cards] = [
  'start',
  'stop',
  'counter',
  'cards'
].map(id => document.getElementById(id))

let abortController = new AbortController()

start.addEventListener('click', async () => {
  try {
    const reader = await consumeAPI(abortController.signal)
    await reader.pipeTo(appendToHtml(cards, counterLabel), {
      signal: abortController.signal
    })
  } catch (error) {
    console.log('error', error)
  }
})

stop.addEventListener('click', () => {
  abortController.abort()
  console.log('aborting...')
  drawing = false
  window.cancelAnimationFrame(rafId)
  abortController = new AbortController()
})
