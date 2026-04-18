import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        buy: "#16a34a",
        skip: "#ca8a04",
        ret: "#dc2626",
      },
    },
  },
  plugins: [],
};

export default config;
