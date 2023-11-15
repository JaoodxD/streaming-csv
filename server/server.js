import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { TransformStream } from 'node:stream/web'
import { Readable, Transform, Writable } from 'node:stream'
import { setTimeout as wait } from 'node:timers/promises'
import csvtojson from 'csvtojson'
export default function serve ({ port, path, throttle }) {
  const server = createServer(async function (request, response) {
    const csv = createReadStream(path)
    await Readable.toWeb(csv)
      .pipeThrough(Transform.toWeb(csvtojson()))
      .pipeThrough(
        new TransformStream({
          async transform (chunk, controller) {
            const data = JSON.parse(Buffer.from(chunk))
            const mappedData = JSON.stringify({ line: data.Quote }) + '\n'
            if (throttle) await wait(throttle)
            controller.enqueue(mappedData)
          }
        })
      )
      .pipeTo(Writable.toWeb(response))
  })

  server.listen(port).on('listening', () => {
    console.log('listening on port ', port)
  })

  return { stop }

  function stop () {
    console.log('closing server...')
    server.close()
  }
}
