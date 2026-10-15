import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Packages pulled in only by .docx parsing (mammoth + its dependency tree).
// They are grouped into their own chunk so they are fetched on demand
// instead of blocking startup.
const DOCX_VENDOR = [
  "mammoth",
  "underscore",
  "bluebird",
  "jszip",
  "xzlib",
  "@xmldom",
  "dingbat-to-unicode",
  "lop",
  "base64-js",
  "argparse",
  "xmlbuilder",
  "path-is-absolute",
  "lie",
  "pako",
  "setimmediate",
  "es6-promise",
  "immediate",
];

const isDocxVendor = (id) =>
  DOCX_VENDOR.some((name) => id.includes(`/node_modules/${name}/`));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Heavy SDKs (pdfjs, firebase, mammoth, pako) are dynamically imported
    // at their call sites, so their chunks are fetched on demand only.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (isDocxVendor(id)) return "docx";
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id))
            return "react";
        },
      },
    },
  },
})
