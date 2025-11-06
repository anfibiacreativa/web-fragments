// vite.config.ts
import { defineConfig } from "file:///Users/nvenditto/Projects/Microsoft/web-fragments/node_modules/.pnpm/vite@5.3.3_@types+node@20.14.10_lightningcss@1.27.0_terser@5.34.1/node_modules/vite/dist/node/index.js";
import { qwikVite } from "file:///Users/nvenditto/Projects/Microsoft/web-fragments/node_modules/.pnpm/@builder.io+qwik@1.7.1_@types+node@20.14.10_lightningcss@1.27.0_terser@5.34.1_undici@6.19.2/node_modules/@builder.io/qwik/optimizer.mjs";
import { qwikCity } from "file:///Users/nvenditto/Projects/Microsoft/web-fragments/node_modules/.pnpm/@builder.io+qwik-city@1.7.1_@types+node@20.14.10_lightningcss@1.27.0_rollup@4.34.6_terser@5.34.1/node_modules/@builder.io/qwik-city/vite/index.mjs";
import tsconfigPaths from "file:///Users/nvenditto/Projects/Microsoft/web-fragments/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.5.4_vite@5.3.3_@types+node@20.14.10_lightningcss@1.27.0_terser@5.34.1_/node_modules/vite-tsconfig-paths/dist/index.mjs";

// package.json
var package_default = {
  name: "pierced-react___qwik-fragment",
  engines: {
    node: "^18.17.0 || ^20.3.0 || >=21.0.0"
  },
  "engines-annotation": "Mostly required by sharp which needs a Node-API v9 compatible runtime",
  private: true,
  trustedDependencies: [
    "sharp"
  ],
  "trustedDependencies-annotation": "Needed for bun to allow running install scripts",
  type: "module",
  scripts: {
    build: "qwik build",
    "build.client": "vite build",
    "build.preview": "vite build --ssr src/entry.preview.tsx",
    "build.server": "vite build -c adapters/cloudflare-pages/vite.config.ts",
    "build.types": "tsc --incremental --noEmit",
    deploy: "wrangler pages deploy ./dist",
    dev: "vite --mode ssr",
    "dev.debug": "node --inspect-brk ./node_modules/vite/bin/vite.js --mode ssr --force",
    preview: "qwik build preview && vite preview --open",
    serve: "wrangler pages dev ./dist --compatibility-date 2024-07-01 --compatibility-flags=nodejs_als",
    start: "vite --open --mode ssr",
    buildAndServe: "pnpm build && pnpm serve --port 8123",
    "types:check": "tsc --noEmit",
    qwik: "qwik"
  },
  devDependencies: {
    "@builder.io/qwik": "1.7.1",
    "@builder.io/qwik-city": "1.7.1",
    "@types/node": "^20.12.7",
    typescript: "^5.5.4",
    undici: "*",
    vite: "^5.2.10",
    "vite-tsconfig-paths": "^4.2.1",
    wrangler: "^3.63.1"
  }
};

// vite.config.ts
var { dependencies = {}, devDependencies = {} } = package_default;
errorOnDuplicatesPkgDeps(devDependencies, dependencies);
var vite_config_default = defineConfig(({ command, mode }) => {
  return {
    // mode: "development",
    build: {
      minify: false,
      assetsDir: "_fragment/qwik/assets"
    },
    plugins: [
      qwikCity({
        trailingSlash: false
      }),
      qwikVite(),
      tsconfigPaths()
    ],
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      // For example ['better-sqlite3'] if you use that in server functions.
      exclude: []
    },
    /**
     * This is an advanced setting. It improves the bundling of your server code. To use it, make sure you understand when your consumed packages are dependencies or dev dependencies. (otherwise things will break in production)
     */
    // ssr:
    //   command === "build" && mode === "production"
    //     ? {
    //         // All dev dependencies should be bundled in the server build
    //         noExternal: Object.keys(devDependencies),
    //         // Anything marked as a dependency will not be bundled
    //         // These should only be production binary deps (including deps of deps), CLI deps, and their module graph
    //         // If a dep-of-dep needs to be external, add it here
    //         // For example, if something uses `bcrypt` but you don't have it as a dep, you can write
    //         // external: [...Object.keys(dependencies), 'bcrypt']
    //         external: Object.keys(dependencies),
    //       }
    //     : undefined,
    server: {
      headers: {
        // Don't cache the server response in dev mode
        "Cache-Control": "public, max-age=0"
      }
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        "Cache-Control": "public, max-age=600"
      }
    }
  };
});
function errorOnDuplicatesPkgDeps(devDependencies2, dependencies2) {
  let msg = "";
  const duplicateDeps = Object.keys(devDependencies2).filter((dep) => dependencies2[dep]);
  const qwikPkg = Object.keys(dependencies2).filter((value) => /qwik/i.test(value));
  msg = `Move qwik packages ${qwikPkg.join(", ")} to devDependencies`;
  if (qwikPkg.length > 0) {
    throw new Error(msg);
  }
  msg = `
    Warning: The dependency "${duplicateDeps.join(", ")}" is listed in both "devDependencies" and "dependencies".
    Please move the duplicated dependencies to "devDependencies" only and remove it from "dependencies"
  `;
  if (duplicateDeps.length > 0) {
    throw new Error(msg);
  }
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL252ZW5kaXR0by9Qcm9qZWN0cy9NaWNyb3NvZnQvd2ViLWZyYWdtZW50cy9lMmUvcGllcmNlZC1yZWFjdC9mcmFnbWVudHMvcXdpa1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL252ZW5kaXR0by9Qcm9qZWN0cy9NaWNyb3NvZnQvd2ViLWZyYWdtZW50cy9lMmUvcGllcmNlZC1yZWFjdC9mcmFnbWVudHMvcXdpay92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbnZlbmRpdHRvL1Byb2plY3RzL01pY3Jvc29mdC93ZWItZnJhZ21lbnRzL2UyZS9waWVyY2VkLXJlYWN0L2ZyYWdtZW50cy9xd2lrL3ZpdGUuY29uZmlnLnRzXCI7LyoqXG4gKiBUaGlzIGlzIHRoZSBiYXNlIGNvbmZpZyBmb3Igdml0ZS5cbiAqIFdoZW4gYnVpbGRpbmcsIHRoZSBhZGFwdGVyIGNvbmZpZyBpcyB1c2VkIHdoaWNoIGxvYWRzIHRoaXMgZmlsZSBhbmQgZXh0ZW5kcyBpdC5cbiAqL1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFVzZXJDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHF3aWtWaXRlIH0gZnJvbSAnQGJ1aWxkZXIuaW8vcXdpay9vcHRpbWl6ZXInO1xuaW1wb3J0IHsgcXdpa0NpdHkgfSBmcm9tICdAYnVpbGRlci5pby9xd2lrLWNpdHkvdml0ZSc7XG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tICd2aXRlLXRzY29uZmlnLXBhdGhzJztcbmltcG9ydCBwa2cgZnJvbSAnLi9wYWNrYWdlLmpzb24nO1xuXG50eXBlIFBrZ0RlcCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5jb25zdCB7IGRlcGVuZGVuY2llcyA9IHt9LCBkZXZEZXBlbmRlbmNpZXMgPSB7fSB9ID0gcGtnIGFzIGFueSBhcyB7XG5cdGRlcGVuZGVuY2llczogUGtnRGVwO1xuXHRkZXZEZXBlbmRlbmNpZXM6IFBrZ0RlcDtcblx0W2tleTogc3RyaW5nXTogdW5rbm93bjtcbn07XG5lcnJvck9uRHVwbGljYXRlc1BrZ0RlcHMoZGV2RGVwZW5kZW5jaWVzLCBkZXBlbmRlbmNpZXMpO1xuXG4vKipcbiAqIE5vdGUgdGhhdCBWaXRlIG5vcm1hbGx5IHN0YXJ0cyBmcm9tIGBpbmRleC5odG1sYCBidXQgdGhlIHF3aWtDaXR5IHBsdWdpbiBtYWtlcyBzdGFydCBhdCBgc3JjL2VudHJ5LnNzci50c3hgIGluc3RlYWQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pOiBVc2VyQ29uZmlnID0+IHtcblx0cmV0dXJuIHtcblx0XHQvLyBtb2RlOiBcImRldmVsb3BtZW50XCIsXG5cdFx0YnVpbGQ6IHtcblx0XHRcdG1pbmlmeTogZmFsc2UsXG5cdFx0XHRhc3NldHNEaXI6ICdfZnJhZ21lbnQvcXdpay9hc3NldHMnLFxuXHRcdH0sXG5cdFx0cGx1Z2luczogW1xuXHRcdFx0cXdpa0NpdHkoe1xuXHRcdFx0XHR0cmFpbGluZ1NsYXNoOiBmYWxzZSxcblx0XHRcdH0pLFxuXHRcdFx0cXdpa1ZpdGUoKSxcblx0XHRcdHRzY29uZmlnUGF0aHMoKSxcblx0XHRdLFxuXHRcdC8vIFRoaXMgdGVsbHMgVml0ZSB3aGljaCBkZXBlbmRlbmNpZXMgdG8gcHJlLWJ1aWxkIGluIGRldiBtb2RlLlxuXHRcdG9wdGltaXplRGVwczoge1xuXHRcdFx0Ly8gUHV0IHByb2JsZW1hdGljIGRlcHMgdGhhdCBicmVhayBidW5kbGluZyBoZXJlLCBtb3N0bHkgdGhvc2Ugd2l0aCBiaW5hcmllcy5cblx0XHRcdC8vIEZvciBleGFtcGxlIFsnYmV0dGVyLXNxbGl0ZTMnXSBpZiB5b3UgdXNlIHRoYXQgaW4gc2VydmVyIGZ1bmN0aW9ucy5cblx0XHRcdGV4Y2x1ZGU6IFtdLFxuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBUaGlzIGlzIGFuIGFkdmFuY2VkIHNldHRpbmcuIEl0IGltcHJvdmVzIHRoZSBidW5kbGluZyBvZiB5b3VyIHNlcnZlciBjb2RlLiBUbyB1c2UgaXQsIG1ha2Ugc3VyZSB5b3UgdW5kZXJzdGFuZCB3aGVuIHlvdXIgY29uc3VtZWQgcGFja2FnZXMgYXJlIGRlcGVuZGVuY2llcyBvciBkZXYgZGVwZW5kZW5jaWVzLiAob3RoZXJ3aXNlIHRoaW5ncyB3aWxsIGJyZWFrIGluIHByb2R1Y3Rpb24pXG5cdFx0ICovXG5cdFx0Ly8gc3NyOlxuXHRcdC8vICAgY29tbWFuZCA9PT0gXCJidWlsZFwiICYmIG1vZGUgPT09IFwicHJvZHVjdGlvblwiXG5cdFx0Ly8gICAgID8ge1xuXHRcdC8vICAgICAgICAgLy8gQWxsIGRldiBkZXBlbmRlbmNpZXMgc2hvdWxkIGJlIGJ1bmRsZWQgaW4gdGhlIHNlcnZlciBidWlsZFxuXHRcdC8vICAgICAgICAgbm9FeHRlcm5hbDogT2JqZWN0LmtleXMoZGV2RGVwZW5kZW5jaWVzKSxcblx0XHQvLyAgICAgICAgIC8vIEFueXRoaW5nIG1hcmtlZCBhcyBhIGRlcGVuZGVuY3kgd2lsbCBub3QgYmUgYnVuZGxlZFxuXHRcdC8vICAgICAgICAgLy8gVGhlc2Ugc2hvdWxkIG9ubHkgYmUgcHJvZHVjdGlvbiBiaW5hcnkgZGVwcyAoaW5jbHVkaW5nIGRlcHMgb2YgZGVwcyksIENMSSBkZXBzLCBhbmQgdGhlaXIgbW9kdWxlIGdyYXBoXG5cdFx0Ly8gICAgICAgICAvLyBJZiBhIGRlcC1vZi1kZXAgbmVlZHMgdG8gYmUgZXh0ZXJuYWwsIGFkZCBpdCBoZXJlXG5cdFx0Ly8gICAgICAgICAvLyBGb3IgZXhhbXBsZSwgaWYgc29tZXRoaW5nIHVzZXMgYGJjcnlwdGAgYnV0IHlvdSBkb24ndCBoYXZlIGl0IGFzIGEgZGVwLCB5b3UgY2FuIHdyaXRlXG5cdFx0Ly8gICAgICAgICAvLyBleHRlcm5hbDogWy4uLk9iamVjdC5rZXlzKGRlcGVuZGVuY2llcyksICdiY3J5cHQnXVxuXHRcdC8vICAgICAgICAgZXh0ZXJuYWw6IE9iamVjdC5rZXlzKGRlcGVuZGVuY2llcyksXG5cdFx0Ly8gICAgICAgfVxuXHRcdC8vICAgICA6IHVuZGVmaW5lZCxcblxuXHRcdHNlcnZlcjoge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQvLyBEb24ndCBjYWNoZSB0aGUgc2VydmVyIHJlc3BvbnNlIGluIGRldiBtb2RlXG5cdFx0XHRcdCdDYWNoZS1Db250cm9sJzogJ3B1YmxpYywgbWF4LWFnZT0wJyxcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRwcmV2aWV3OiB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdC8vIERvIGNhY2hlIHRoZSBzZXJ2ZXIgcmVzcG9uc2UgaW4gcHJldmlldyAobm9uLWFkYXB0ZXIgcHJvZHVjdGlvbiBidWlsZClcblx0XHRcdFx0J0NhY2hlLUNvbnRyb2wnOiAncHVibGljLCBtYXgtYWdlPTYwMCcsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdH07XG59KTtcblxuLy8gKioqIHV0aWxzICoqKlxuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGlkZW50aWZ5IGR1cGxpY2F0ZSBkZXBlbmRlbmNpZXMgYW5kIHRocm93IGFuIGVycm9yXG4gKiBAcGFyYW0ge09iamVjdH0gZGV2RGVwZW5kZW5jaWVzIC0gTGlzdCBvZiBkZXZlbG9wbWVudCBkZXBlbmRlbmNpZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXBlbmRlbmNpZXMgLSBMaXN0IG9mIHByb2R1Y3Rpb24gZGVwZW5kZW5jaWVzXG4gKi9cbmZ1bmN0aW9uIGVycm9yT25EdXBsaWNhdGVzUGtnRGVwcyhkZXZEZXBlbmRlbmNpZXM6IFBrZ0RlcCwgZGVwZW5kZW5jaWVzOiBQa2dEZXApIHtcblx0bGV0IG1zZyA9ICcnO1xuXHQvLyBDcmVhdGUgYW4gYXJyYXkgJ2R1cGxpY2F0ZURlcHMnIGJ5IGZpbHRlcmluZyBkZXZEZXBlbmRlbmNpZXMuXG5cdC8vIElmIGEgZGVwZW5kZW5jeSBhbHNvIGV4aXN0cyBpbiBkZXBlbmRlbmNpZXMsIGl0IGlzIGNvbnNpZGVyZWQgYSBkdXBsaWNhdGUuXG5cdGNvbnN0IGR1cGxpY2F0ZURlcHMgPSBPYmplY3Qua2V5cyhkZXZEZXBlbmRlbmNpZXMpLmZpbHRlcigoZGVwKSA9PiBkZXBlbmRlbmNpZXNbZGVwXSk7XG5cblx0Ly8gaW5jbHVkZSBhbnkga25vd24gcXdpayBwYWNrYWdlc1xuXHRjb25zdCBxd2lrUGtnID0gT2JqZWN0LmtleXMoZGVwZW5kZW5jaWVzKS5maWx0ZXIoKHZhbHVlKSA9PiAvcXdpay9pLnRlc3QodmFsdWUpKTtcblxuXHQvLyBhbnkgZXJyb3JzIGZvciBtaXNzaW5nIFwicXdpay1jaXR5LXBsYW5cIlxuXHQvLyBbUExVR0lOX0VSUk9SXTogSW52YWxpZCBtb2R1bGUgXCJAcXdpay1jaXR5LXBsYW5cIiBpcyBub3QgYSB2YWxpZCBwYWNrYWdlXG5cdG1zZyA9IGBNb3ZlIHF3aWsgcGFja2FnZXMgJHtxd2lrUGtnLmpvaW4oJywgJyl9IHRvIGRldkRlcGVuZGVuY2llc2A7XG5cblx0aWYgKHF3aWtQa2cubGVuZ3RoID4gMCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihtc2cpO1xuXHR9XG5cblx0Ly8gRm9ybWF0IHRoZSBlcnJvciBtZXNzYWdlIHdpdGggdGhlIGR1cGxpY2F0ZXMgbGlzdC5cblx0Ly8gVGhlIGBqb2luYCBmdW5jdGlvbiBpcyB1c2VkIHRvIHJlcHJlc2VudCB0aGUgZWxlbWVudHMgb2YgdGhlICdkdXBsaWNhdGVEZXBzJyBhcnJheSBhcyBhIGNvbW1hLXNlcGFyYXRlZCBzdHJpbmcuXG5cdG1zZyA9IGBcbiAgICBXYXJuaW5nOiBUaGUgZGVwZW5kZW5jeSBcIiR7ZHVwbGljYXRlRGVwcy5qb2luKCcsICcpfVwiIGlzIGxpc3RlZCBpbiBib3RoIFwiZGV2RGVwZW5kZW5jaWVzXCIgYW5kIFwiZGVwZW5kZW5jaWVzXCIuXG4gICAgUGxlYXNlIG1vdmUgdGhlIGR1cGxpY2F0ZWQgZGVwZW5kZW5jaWVzIHRvIFwiZGV2RGVwZW5kZW5jaWVzXCIgb25seSBhbmQgcmVtb3ZlIGl0IGZyb20gXCJkZXBlbmRlbmNpZXNcIlxuICBgO1xuXG5cdC8vIFRocm93IGFuIGVycm9yIHdpdGggdGhlIGNvbnN0cnVjdGVkIG1lc3NhZ2UuXG5cdGlmIChkdXBsaWNhdGVEZXBzLmxlbmd0aCA+IDApIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IobXNnKTtcblx0fVxufVxuIiwgIntcblx0XCJuYW1lXCI6IFwicGllcmNlZC1yZWFjdF9fX3F3aWstZnJhZ21lbnRcIixcblx0XCJlbmdpbmVzXCI6IHtcblx0XHRcIm5vZGVcIjogXCJeMTguMTcuMCB8fCBeMjAuMy4wIHx8ID49MjEuMC4wXCJcblx0fSxcblx0XCJlbmdpbmVzLWFubm90YXRpb25cIjogXCJNb3N0bHkgcmVxdWlyZWQgYnkgc2hhcnAgd2hpY2ggbmVlZHMgYSBOb2RlLUFQSSB2OSBjb21wYXRpYmxlIHJ1bnRpbWVcIixcblx0XCJwcml2YXRlXCI6IHRydWUsXG5cdFwidHJ1c3RlZERlcGVuZGVuY2llc1wiOiBbXG5cdFx0XCJzaGFycFwiXG5cdF0sXG5cdFwidHJ1c3RlZERlcGVuZGVuY2llcy1hbm5vdGF0aW9uXCI6IFwiTmVlZGVkIGZvciBidW4gdG8gYWxsb3cgcnVubmluZyBpbnN0YWxsIHNjcmlwdHNcIixcblx0XCJ0eXBlXCI6IFwibW9kdWxlXCIsXG5cdFwic2NyaXB0c1wiOiB7XG5cdFx0XCJidWlsZFwiOiBcInF3aWsgYnVpbGRcIixcblx0XHRcImJ1aWxkLmNsaWVudFwiOiBcInZpdGUgYnVpbGRcIixcblx0XHRcImJ1aWxkLnByZXZpZXdcIjogXCJ2aXRlIGJ1aWxkIC0tc3NyIHNyYy9lbnRyeS5wcmV2aWV3LnRzeFwiLFxuXHRcdFwiYnVpbGQuc2VydmVyXCI6IFwidml0ZSBidWlsZCAtYyBhZGFwdGVycy9jbG91ZGZsYXJlLXBhZ2VzL3ZpdGUuY29uZmlnLnRzXCIsXG5cdFx0XCJidWlsZC50eXBlc1wiOiBcInRzYyAtLWluY3JlbWVudGFsIC0tbm9FbWl0XCIsXG5cdFx0XCJkZXBsb3lcIjogXCJ3cmFuZ2xlciBwYWdlcyBkZXBsb3kgLi9kaXN0XCIsXG5cdFx0XCJkZXZcIjogXCJ2aXRlIC0tbW9kZSBzc3JcIixcblx0XHRcImRldi5kZWJ1Z1wiOiBcIm5vZGUgLS1pbnNwZWN0LWJyayAuL25vZGVfbW9kdWxlcy92aXRlL2Jpbi92aXRlLmpzIC0tbW9kZSBzc3IgLS1mb3JjZVwiLFxuXHRcdFwicHJldmlld1wiOiBcInF3aWsgYnVpbGQgcHJldmlldyAmJiB2aXRlIHByZXZpZXcgLS1vcGVuXCIsXG5cdFx0XCJzZXJ2ZVwiOiBcIndyYW5nbGVyIHBhZ2VzIGRldiAuL2Rpc3QgLS1jb21wYXRpYmlsaXR5LWRhdGUgMjAyNC0wNy0wMSAtLWNvbXBhdGliaWxpdHktZmxhZ3M9bm9kZWpzX2Fsc1wiLFxuXHRcdFwic3RhcnRcIjogXCJ2aXRlIC0tb3BlbiAtLW1vZGUgc3NyXCIsXG5cdFx0XCJidWlsZEFuZFNlcnZlXCI6IFwicG5wbSBidWlsZCAmJiBwbnBtIHNlcnZlIC0tcG9ydCA4MTIzXCIsXG5cdFx0XCJ0eXBlczpjaGVja1wiOiBcInRzYyAtLW5vRW1pdFwiLFxuXHRcdFwicXdpa1wiOiBcInF3aWtcIlxuXHR9LFxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJAYnVpbGRlci5pby9xd2lrXCI6IFwiMS43LjFcIixcblx0XHRcIkBidWlsZGVyLmlvL3F3aWstY2l0eVwiOiBcIjEuNy4xXCIsXG5cdFx0XCJAdHlwZXMvbm9kZVwiOiBcIl4yMC4xMi43XCIsXG5cdFx0XCJ0eXBlc2NyaXB0XCI6IFwiXjUuNS40XCIsXG5cdFx0XCJ1bmRpY2lcIjogXCIqXCIsXG5cdFx0XCJ2aXRlXCI6IFwiXjUuMi4xMFwiLFxuXHRcdFwidml0ZS10c2NvbmZpZy1wYXRoc1wiOiBcIl40LjIuMVwiLFxuXHRcdFwid3JhbmdsZXJc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
