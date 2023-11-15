import { join } from 'desm'
import serve from './server/server.js'

const datasets = {
  facebook: {
    path: join(import.meta.url, './datasets/FACEBOOK_REVIEWS.csv'),
    fields: {
      title: 'author_name',
      description: 'review_text'
    }
  },
  anime: {
    path: join(import.meta.url, './datasets/AnimeQuotes.csv'),
    fields: {
      title: 'Character',
      description: 'Quote'
    }
  }
}

const { stop } = serve({ port: 3000, throttle: 100, ...datasets.facebook })

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
