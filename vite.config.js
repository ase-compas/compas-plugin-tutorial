import { existsSync, globSync, rmSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { defineConfig } from 'vite';

const root = import.meta.dirname;
const pluginDir = resolve(root, 'src/plugins');

/** `/plugins/examples/foo.js` -> the `src/plugins/examples/foo.{ts,js}` file. */
function pluginSource(url) {
  return ['.ts', '.js']
    .map(ext => `/src${url}`.replace(/\.js$/, ext))
    .find(path => existsSync(resolve(root, `.${path}`)));
}

const isTest = file => /\.(test|spec)\.[jt]s$/.test(file);

/** A source file -> the `/plugins/…` URL it is served at, if it is a plugin. */
function pluginUrl(file) {
  const path = relative(pluginDir, file);
  if (path.startsWith('..') || isTest(path)) return undefined;
  return `/plugins/${path.replace(/\.[jt]s$/, '.js')}`;
}

/**
 * The front page of the built site. GitHub Pages serves no directory listing,
 * so without this the deployment's root is a 404 and the plugin URLs are
 * guesswork. Each `<code>` is rewritten to its absolute URL in the browser,
 * ready to paste into OpenSCD.
 */
const indexHtml = urls => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpenSCD plugins</title>
    <style>
      body { margin: 0 auto; padding: 2rem 1rem; max-width: 46rem;
             font: 16px/1.6 system-ui, sans-serif; color-scheme: light dark; }
      li { margin: .4rem 0; }
      code { font-size: .85em; overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <h1>OpenSCD plugins</h1>
    <p>Add any of these URLs to OpenSCD as a custom plugin:</p>
    <ul>
      ${urls.map(url => `<li><code>${url}</code></li>`).join('\n      ')}
    </ul>
    <script>
      for (const el of document.querySelectorAll('code'))
        el.textContent = new URL(el.textContent, location.href).href;
    </script>
  </body>
</html>
`;

/** Every module under `src/plugins/` is a plugin, and gets its own bundle. */
const plugins = globSync('src/plugins/**/*.{js,ts}', { cwd: root, exclude: isTest })
  .sort()
  .map((file, i) => ({
    name: file.replace(/^src\//, '').replace(/\.[jt]s$/, ''),
    file: resolve(root, file),
    environment: `plugin${i}`, // environment names may only be [\w$]
  }));

/**
 * One build environment per plugin. A build with several inputs moves code
 * they share into a chunk of its own, but OpenSCD loads a plugin from a single
 * URL, so each plugin is built alone and bundles everything it imports.
 */
const environments = Object.fromEntries(
  plugins.map(({ name, file, environment }) => [
    environment,
    { consumer: 'client', build: { rolldownOptions: { input: { [name]: file } } } },
  ]),
);

const outDir = resolve(root, 'dist');

export default defineConfig(({ command }) => ({
  plugins: [
    {
      name: 'oscd-plugins',

      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          // serve plugins under the same `/plugins/…js` URLs as the build does
          const [path, query] = req.url?.split('?') ?? [];
          if (path?.startsWith('/plugins/')) {
            const source = pluginSource(path);
            if (source) req.url = query ? `${source}?${query}` : source;
          }
          next();
        });
      },

      // Let the dev shell swap the changed plugin in place, so that the
      // document being edited survives a plugin edit.
      handleHotUpdate({ file, server }) {
        const url = pluginUrl(file);
        if (!url) return undefined;
        server.ws.send({ type: 'custom', event: 'oscd:plugin-update', data: { url } });
        return [];
      },
    },
  ],

  // OpenSCD may run on another origin (e.g. openscd.github.io) while it loads
  // plugins from here, so plugin modules have to be fetchable cross-origin.
  server: { cors: true },
  preview: { cors: true },

  // The plugin environments are only needed to build, the dev server serves
  // every plugin from source anyway.
  environments: command === 'build' ? environments : {},

  builder: {
    async buildApp(builder) {
      rmSync(outDir, { recursive: true, force: true });
      for (const { name, environment } of plugins) {
        const [{ output }] = [await builder.build(builder.environments[environment])].flat();
        // A second file (a CSS file, an image, …) would be one the plugin
        // can't find once it is loaded on its own.
        if (output.length > 1)
          throw new Error(
            `${name} is not self-contained, it also emits ` +
              output.slice(1).map(file => file.fileName).join(', '),
          );
      }
      writeFileSync(
        resolve(outDir, 'index.html'),
        indexHtml(plugins.map(({ name }) => `${name}.js`)),
      );
    },
  },

  build: {
    outDir,
    // Each plugin's build writes into the same `dist/`, so `buildApp` empties
    // it once, before the first one.
    emptyOutDir: false,
    rolldownOptions: {
      // Plugins are consumed as ES modules by OpenSCD, so the default export
      // must survive tree-shaking.
      preserveEntrySignatures: 'strict',
      output: { entryFileNames: '[name].js', codeSplitting: false },
    },
  },
}));
