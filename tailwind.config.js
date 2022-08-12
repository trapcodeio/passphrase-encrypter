const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "4rem"
      }
    },

    extend: {
      colors: {
        primary: colors.pink
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
};
