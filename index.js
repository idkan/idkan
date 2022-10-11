import { } from 'dotenv/config'
import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import Parser from 'rss-parser'

const MAX_NUMBER_OF = {
  ARTICLES: 3,
  PHOTOS: 3
}

const PLACEHOLDER = {
  LATEST_ARTICLES: '%{{latest_articles}}%',
  LATEST_INSTAGRAM_PHOTOS: '%{{latest_instagram_photos}}%',
  DAY_NAME: '%{{day_name}}'
}

const INSTAGRAM_USER_ID = '245376239'

const parser = new Parser()

const getLatestPosts = () => {
  return parser.parseURL('https://idkan.dev/feed.xml').then(data => data.items)
}

const getLatestInstagramPhotos = async () => {
  const response = await fetch(`https://instagram130.p.rapidapi.com/account-medias?userid=${INSTAGRAM_USER_ID}&first=${MAX_NUMBER_OF.PHOTOS}`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Host': 'instagram130.p.rapidapi.com',
      'X-RapidAPI-Key': process.env.RAPIDAPI_API_KEY
    }
  })
  const data = await response.json()

  return data?.edges
}

const getCurrentDayName = () => {
  const date = new Date()
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

;(async () => {
  const [template, articles, instagramPosts] = await Promise.all([
    fs.readFile('./README.md.tpl', { encoding: 'utf8' }),
    getLatestPosts(),
    getLatestInstagramPhotos()
  ])

  const latestArticles = articles.slice(0, MAX_NUMBER_OF.ARTICLES).map(({
    title,
    link,
    contentSnippet
  }) => `<li><a href="${link}"><b>${title}</b></a><br><i>${contentSnippet}</i></li>`).join('\n\t')

  const latestInstagramPhotos = instagramPosts?.length !== 0
    ? instagramPosts?.slice(0, MAX_NUMBER_OF.PHOTOS).map(({
        node: {
          display_url: url,
          shortcode
        }
      }) => `<a href="https://instagram.com/p/${shortcode}"><img src="${url}" alt="${shortcode}" width="200" /></a>`).join('\n\t')
    : '<i>🚧 UPS, no photos found 😥 🚧</i>'

  const newTemplate = template
    .replace(PLACEHOLDER.LATEST_ARTICLES, latestArticles)
    .replace(PLACEHOLDER.LATEST_INSTAGRAM_PHOTOS, latestInstagramPhotos || '<i>🚧 UPS, no photos found 😥 🚧</i>')
    .replace(PLACEHOLDER.DAY_NAME, getCurrentDayName())

  await fs.writeFile('./README.md', newTemplate, { encoding: 'utf8' })
})()
