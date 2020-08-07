const tailwindcss = require('tailwindcss');

const isDev = process.env.NODE_ENV = 'development'

const plugins = [tailwindcss];

if (!isDev) {
  const puregecss = require('@fullhuman/postcss-purgecss');

  class TailwindExtractor {
    static extract(content) {
      return content.match(/[A-z0-9-:\/]+/g) || [];
    }
  }

  plugins.push(
    puregecss({
      content: ['src/*.html'],
      extractors: [
        {
          extractor: TailwindExtractor,
          extensions: ['html']
        }
      ]
    })
  )
}

module.exports = {
  plugins,
}