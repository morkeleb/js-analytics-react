import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

const extensions = [".ts", ".tsx"];

export default {
  input: "src/index.ts",
  output: [
    {
      file: "lib/bundles/bundle.esm.js",
      format: "esm",
      sourcemap: true,
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
        fetch: "fetch",
      },
    },
    {
      file: "lib/bundles/bundle.esm.min.js",
      format: "esm",
      plugins: [terser()],
      sourcemap: true,
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
        fetch: "fetch",
      },
    },
    {
      file: "lib/bundles/bundle.umd.js",
      format: "umd",
      name: "myLibrary",
      sourcemap: true,
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
        fetch: "fetch",
      },
    },
    {
      file: "lib/bundles/bundle.umd.min.js",
      format: "umd",
      name: "myLibrary",
      plugins: [terser()],
      sourcemap: true,
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
        fetch: "fetch",
      },
    },
  ],
  external: ["react", "react-dom", "fetch"],
  plugins: [resolve({ extensions }), typescript({})],
};
