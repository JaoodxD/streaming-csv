import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { TransformStream } from 'node:stream/web'
import { Readable, Transform, Writable } from 'node:stream'
import { setTimeout as wait } from 'node:timers/promises'
import csvtojson from 'csvtojson'

export default function serve ({ port, path, fields, throttle }) {
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

    const abortController = new AbortController()
    let chunksCount = 0
    try {
      response.writeHead(200, headers)
      response.on('finish', () => {
        console.log('Total chunks sent', chunksCount)
      })
      const { signal } = abortController
      const csv = createReadStream(path, { signal })
      await Readable.toWeb(csv)
        .pipeThrough(Transform.toWeb(csvtojson()))
        .pipeThrough(
          new TransformStream({
            async transform (chunk, controller) {
              const data = JSON.parse(Buffer.from(chunk))
              const mappedData = {}
              for (const field in fields) {
                const src = fields[field]
                mappedData[field] = data[src]
              }
              if (throttle) await wait(throttle)
              chunksCount++
              controller.enqueue(JSON.stringify(mappedData).concat('\n'))
            }
          })
        )
        .pipeTo(Writable.toWeb(response))
    } catch (error) {
      if (error.message.includes('abort')) {
        abortController.abort()
        console.log('aborted after chunks:', chunksCount)
      } else console.log('something happen', error)
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
