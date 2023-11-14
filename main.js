import { join } from 'desm'
import serve from './server/server.js'

const path = join(import.meta.url, './datasets/AnimeQuotes.csv')

const { stop } = serve({ port: 3000, path })

process.on('SIGINT', stop)
process.on('SIGTERM', stop)