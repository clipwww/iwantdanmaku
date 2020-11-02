module.exports = {
  purge: {
    enabled: true,
    layers: ['components', 'utilities'],
    content: [
      './src/**/*.html',
      './src/**/*.vue',
    ]
  },
  theme: {
    extend: {
      screens: {
        // light: { raw: "(prefers-color-scheme: light)" },
        dark: { raw: '(prefers-color-scheme: dark)' },
        // => @media (prefers-color-scheme: dark) { ... }
      },
      lineHeight: {
        '0': 0
      }
    },
  },
  variants: {},
  plugins: [
    function ({ addBase, config }) {
      addBase({
        body: {
          color: config("theme.colors.white"),
          backgroundColor: config("theme.colors.gray.900")
        },
      });
    }
  ],
}