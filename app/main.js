const API_URL = 'http://localhost:3000'

async function consumeAPI () {
  const res = await fetch(API_URL)
  const reader = res.body.pipeTo(
    new WritableStream({
      write (chunk) {
        console.log(chunk)
      }
    })
  )
}

await consumeAPI()
