import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { TransformStream } from 'node:stream/web'
import { Readable, Transform, Writable } from 'node:stream'
import { setTimeout as wait } from 'node:timers/promises'
import csvtojson from 'csvtojson'

export default function serve ({ port, path, throttle }) {
  const server = createServer(async function (request, response) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*'
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204, headers)
      response.end()
      return
    }

    try {
      response.writeHead(headers)
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
    } catch (error) {
      console.log('something happen', error)
    }
  })

  server.listen(port).on('listening', () => {
    console.log('listening on port', port)
  })

  return { stop }

  function stop () {
    console.log('closing server...')
    server.close()
  }
}
