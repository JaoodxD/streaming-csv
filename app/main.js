const API_URL = 'http://localhost:3000'

async function consumeAPI (signal) {
  const res = await fetch(API_URL, { signal })
  const reader = res.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
  // .pipeTo(appendToHtml(cards))
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

function appendToHtml (element) {
  let counter = 0
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
      if (totalCards >= 16) {
        totalCards = 0
        element.innerHTML = ''
      }
      totalCards++
      element.innerHTML += card
    },
    abort (reason) {
      console.log('aborted*', reason)
    }
  })
}

const [start, stop, cards] = ['start', 'stop', 'cards'].map(id =>
  document.getElementById(id)
)

let abortController = new AbortController()

start.addEventListener('click', async () => {
  try {
    const reader = await consumeAPI(abortController.signal)
    await reader.pipeTo(appendToHtml(cards), { signal: abortController.signal })
  } catch (error) {
    console.log('error', error)
  }
})

stop.addEventListener('click', () => {
  abortController.abort()
  console.log('aborting...')
  abortController = new AbortController()
})
