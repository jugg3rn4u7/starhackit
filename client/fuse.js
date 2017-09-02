const {
  FuseBox,
  SVGPlugin,
  CSSPlugin,
  JSONPlugin,
  ImageBase64Plugin,
  BabelPlugin,
  QuantumPlugin,
  WebIndexPlugin,
  ReplacePlugin,
  Sparky
} = require("fuse-box");
const fs = require('fs-extra')
var pkg = require("./package.json");

let fuse, app, vendor, isProduction;

Sparky.task("config", () => {
  fuse = new FuseBox({
    debug: true,
    cache: true,
    homeDir: "src/app",
    sourceMaps: !isProduction,
    hash: isProduction,
    output: "dist/$name.js",
    sourceMaps: true,
    plugins: [
      SVGPlugin(),
      CSSPlugin(),
      JSONPlugin(),
      ImageBase64Plugin(),
      BabelPlugin(),
      WebIndexPlugin({
        template: "src/index.ejs",
        title: "Starhackit"
      }),
      isProduction &&
        QuantumPlugin({
          removeExportsInterop: false,
          uglify: true
        }),
      ReplacePlugin({ __VERSION__: JSON.stringify(pkg.version) })
    ],
    experimentalFeatures: true,
    alias: {
      react: "preact-compat",
      "react-dom": "preact-compat",
      "create-react-class": "preact-compat/lib/create-react-class",
      glamorous: "glamorous/dist/glamorous.cjs.tiny.js",
      components: "~/components",
      utils: "~/utils",
      services: "~/services",
      parts: "~/parts",
      icons: "~/icons",
      config: "~/config.js"
    }
  });
  // vendor
  vendor = fuse
    .bundle("vendor")
    .instructions("~ index.js")
    .target("browser");

  // bundle app
  app = fuse
    .bundle("app")
    .split("parts/landing/**", "landing > parts/landing/landingScreen.js")
    .split(
      "components/componentGuide.js",
      "guide > components/componentGuide.js"
    )
    .split("parts/db/**", "dbSchema > parts/db/SchemaComponent.js")
    .split("parts/theme/**", "theme > parts/theme/ThemeView.js")
    .split("parts/admin/**", "users > parts/admin/users.js")
    .instructions("> [index.js] [**/**.js]")
    .target("browser");

    // Copy the locales
    fs.copy('locales/', 'dist/locales')
    .then(() => console.log('locales copied'))
    .catch(err => console.error(err))
});

Sparky.task("default", ["clean", "config"], () => {
  fuse.dev({
    open: true,
    proxy: {
      "/api/v1": {
        logLevel: 'debug',
        target: "http://localhost:9000",
      }
    }
  });
  // add dev instructions
  app.watch().hmr();
  return fuse.run();
});

Sparky.task("clean", () => Sparky.src("dist/").clean("dist/"));
Sparky.task("prod-env", ["clean"], () => {
  isProduction = true;
});
Sparky.task("dist", ["prod-env", "config"], () => {
  // comment out to prevent dev server from running (left for the demo)
  //fuse.dev();
  return fuse.run();
});
