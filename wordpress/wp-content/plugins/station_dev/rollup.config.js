import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import tailwind from "tailwindcss";
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "assets/src/main.js",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "assets/build/bundle.js",
  },
  preprocess: sveltePreprocess({
    postcss: {
      plugins: [tailwind("./tailwind.config.js")],
    },
  }),

  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      css: (css) => {
        css.write("assets/build/bundle.css");
      },
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/rollup-plugin-commonjs
    resolve({ browser: true }),
    commonjs(),
    builtins(),
    globals(),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
};
