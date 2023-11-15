const API_URL = 'http://localhost:3000'

async function consumeAPI ({ signal }) {
  const res = await fetch(API_URL, { signal })
  const reader = res.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
    .pipeTo(
      new WritableStream({
        write (chunk) {
          console.log(chunk)
        }
      })
    )
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

const [start, stop, cards] = ['start', 'stop', 'cards'].map(id =>
  document.getElementById(id)
)

let abortController = new AbortController()

start.addEventListener('click', async () => {
  abortController = new AbortController()
  await consumeAPI(abortController)
})

stop.addEventListener('click', async () => {
  try {
    abortController.abort()
    console.log('aborting...')
  } catch (error) {
    console.log('something happen', error)
  }
})
