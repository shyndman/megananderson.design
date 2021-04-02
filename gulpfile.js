// generated on 2020-10-01 using generator-webapp 4.0.0-8
const { src, dest, watch, series, parallel, lastRun } = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');
const del = require('del');
const cssnano = require('cssnano');
const svgInliner = require('sass-inline-svg');
const { argv } = require('yargs');

const webpack = require('webpack-stream');
const buildWebpackConfig = require('./webpack.config');

const nunjucksMarkdown = require('nunjucks-markdown');
const marked = require('marked');

const $ = gulpLoadPlugins();
const server = browserSync.create();

const port = argv.port || 9000;

const env = !!process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isDev = !isProd && !isTest;

function styles() {
  return src(['app/styles/*.scss', 'app/styles/pages/*.scss'], {
    sourcemaps: !isProd,
  })
    .pipe(
      $.dartSass
        .sync({
          includePaths: [
            'node_modules/breakpoint-sass/stylesheets',
            'node_modules/normalize-scss/sass',
            'node_modules/sass-bem',
          ],
          functions: {
            'svg($path, $selectors: null)': svgInliner(
              !isProd ? './app' : './dist',
            ),
          },
        })
        .on('error', $.dartSass.logError),
    )
    .pipe(
      dest('.tmp/styles', {
        sourcemaps: !isProd,
      }),
    )
    .pipe(server.reload({ stream: true }));
}

function scripts() {
  return webpack(buildWebpackConfig(env))
    .pipe(
      dest(!isProd ? '.tmp/scripts' : 'dist/scripts', {
        sourcemaps: !isProd ? '.' : false,
      }),
    )
    .pipe(server.reload({ stream: true }));
}

const lintBase = (files, options) => {
  return src(files)
    .pipe($.eslint(options))
    .pipe(server.reload({ stream: true, once: true }))
    .pipe($.eslint.format())
    .pipe($.if(!server.active, $.eslint.failAfterError()));
};

function lint() {
  return lintBase('app/scripts/**/*.js', { fix: true }).pipe(
    dest('app/scripts'),
  );
}

function lintTest() {
  return lintBase('test/spec/**/*.js');
}

function views() {
  return src('app/*.njk')
    .pipe(
      $.nunjucksRender({
        path: 'app',
        manageEnv: (env) => {
          // Configure to render markdown
          nunjucksMarkdown.register(env, marked);
        },
      }),
    )
    .pipe($.inlineSource({ rootpath: '.tmp' }))
    .pipe(dest('.tmp'))
    .pipe(server.reload({ stream: true }));
}

function html() {
  return src(['app/*.html', '.tmp/*.html'])
    .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
    .pipe($.if(/\.js$/, $.uglify({ compress: { drop_console: true } })))
    .pipe(
      $.if(/\.css$/, $.postcss([cssnano({ safe: true, autoprefixer: false })])),
    )
    .pipe(
      $.if(
        /\.html$/,
        $.htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: { compress: { drop_console: true } },
          processConditionalComments: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
        }),
      ),
    )
    .pipe(dest('dist'));
}

function images() {
  return src('app/images/**/*', { since: lastRun(images) })
    .pipe($.imagemin([], { verbose: true }))
    .pipe(dest('dist/images'));
}

function fonts() {
  return src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}').pipe(
    $.if(!isProd, dest('.tmp/fonts'), dest('dist/fonts')),
  );
}

function extras() {
  return src(['app/*', '!app/*.html', '!app/*.njk'], {
    dot: true,
  }).pipe(dest('dist'));
}

function clean() {
  return del(['.tmp', 'dist']);
}

function measureSize() {
  return src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
}

const build = series(
  clean,
  images,
  parallel(lint, series(parallel(styles, scripts), views, html), fonts, extras),
  measureSize,
);

function startAppServer() {
  server.init({
    notify: false,
    open: false,
    port,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/node_modules': 'node_modules',
      },
      serveStaticOptions: {
        extensions: ['html'],
      },
    },
  });

  watch(['app/*.html', 'app/images/**/*', '.tmp/fonts/**/*']).on(
    'change',
    server.reload,
  );

  watch('app/**/*.{html,njk,md}', views);
  watch('app/styles/**/*.scss', series(styles, views));
  watch('app/scripts/**/*.js', scripts);
  watch('app/fonts/**/*', fonts);
}

function startTestServer() {
  server.init({
    notify: false,
    port,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/node_modules': 'node_modules',
      },
    },
  });

  watch('test/index.html').on('change', server.reload);
  watch('app/scripts/**/*.js', scripts);
  watch('test/spec/**/*.js', lintTest);
}

function startDistServer() {
  server.init({
    notify: false,
    port,
    server: {
      baseDir: 'dist',
      routes: {
        '/node_modules': 'node_modules',
      },
    },
  });
}

let serve;
if (isDev) {
  serve = series(
    clean,
    parallel(styles, scripts, fonts),
    views,
    startAppServer,
  );
} else if (isTest) {
  serve = series(views, clean, scripts, startTestServer);
} else if (isProd) {
  serve = series(build, startDistServer);
}

exports.serve = serve;
exports.build = build;
exports.default = build;
