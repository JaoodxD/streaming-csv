import { join } from 'desm'
import serve from './server/server.js'

const path = join(import.meta.url, './datasets/FACEBOOK_REVIEWS.csv')
const fields = {
  title: 'author_name',
  description: 'review_text'
}

const { stop } = serve({ port: 3000, throttle: 100, path, fields })

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
