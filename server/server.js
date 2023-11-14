import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import csvtojson from 'csvtojson'
export default function serve ({ port, path }) {
  const server = createServer(async function (request, response) {
    const csv = createReadStream(path)
    await pipeline(csv, csvtojson(), response)
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
