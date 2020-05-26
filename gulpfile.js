const gulp = require('gulp');
const gzip = require('gulp-gzip');
const connect = require('gulp-connect');
const gulpSequence = require('gulp-sequence');
const closure = require('dj-gulp-tasks/closure');

// Configs
const depsConfig = {
  'output': './etc/momentum.deps.js',
  'prefix': '../../../../',
  'files': [
    './src/**/*.js'
  ]
};

const mainBuildConfig = {
  'output': './dist/momentum.min.js',
  'files': [
    './node_modules/google-closure-library/closure/goog/base.js',
    './src/momentum/**/*.js'
  ],
  'config': {
    'closure_entry_point': 'momentum',
    'externs': [
      './etc/momentum.externs.js'
    ],
  }
};

const moduleBuildConfig = {
  'output': './dist/index.js',
  'files': [
    './node_modules/google-closure-library/closure/goog/base.js',
    './src/momentum/**/*.js'
  ],
  'config': {
    'closure_entry_point': 'momentum.module',
    'externs': [
      './etc/momentum.externs.js'
    ]
  }
};


const debugBuildConfig = {
  'output': './dist/debug/momentum.min.js',
  'files': [
    './node_modules/google-closure-library/closure/goog/base.js',
    './src/**/*.js'
  ],
  'config': {
    'closure_entry_point': 'momentumdebug',
    'externs': [
      './etc/momentum.externs.js'
    ]
  }
};

gulp.task('js-dist-main-build', () => closure.distCompile(mainBuildConfig));
gulp.task('js-dist-module-build', () => closure.distCompile(moduleBuildConfig));
gulp.task('js-dist-debug-build', () => closure.distCompile(debugBuildConfig));
gulp.task('js-deps-build', () => closure.depsBuild(depsConfig));
gulp.task('js-deps-watch', ['js-deps-build'], () => {
    return closure.depsWatch(depsConfig, () => gulp.start('js-deps-build'))
});

// Tasks
gulp.task('compress-js', () => {
  gulp.src('./dist/momentum.min.js')
   .pipe(gzip())
   .pipe(gulp.dest('./dist/'));

  gulp.src('./dist/debug/momentum.min.js')
   .pipe(gzip())
   .pipe(gulp.dest('./dist/debug/'));
});

gulp.task('build', gulpSequence(
  'js-dist-main-build',
  'js-dist-module-build',
  'js-dist-debug-build',
  'compress-js'
));

gulp.task('server', () => {
  return connect.server({
    host: '0.0.0.0',
    root: ['./demos', './'],
    livereload: true,
    port: 8000
  });
});

gulp.task('start', () => {
  gulp.start('js-deps-watch', 'server');
});

gulp.task('default', ['build']);