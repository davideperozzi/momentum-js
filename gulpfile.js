const gulp = require('gulp');
const gzip = require('gulp-gzip');
const connect = require('gulp-connect');
const gulpSequence = require('gulp-sequence');
const closure = require('dj-gulp-tasks/closure');

closure.deps({
  'output': './etc/momentum.deps.js',
  'prefix': '../../../../',
  'files': [
    './src/**/*.js'
  ]
});

closure.compile({
  'output': './dist/application.min.js',
  'files': [
    './node_modules/google-closure-library/closure/goog/base.js',
    './node_modules/google-closure-library/closure/goog/dom/**/*.js',
    './src/momentum/**/*.js'
  ],
  'config': {
    'closure_entry_point': 'momentum',
    'externs': [
      './etc/momentum.externs.js'
    ]
  }
}, '-main');

closure.compile({
  'output': './dist/debug/application.min.js',
  'files': [
    './node_modules/google-closure-library/closure/goog/base.js',
    './node_modules/google-closure-library/closure/goog/dom/**/*.js',
    './src/**/*.js'
  ],
  'config': {
    'closure_entry_point': 'momentum',
    'externs': [
      './etc/momentum.externs.js'
    ]
  }
}, '-debug');

gulp.task('compress-js', () => {
	gulp.src('./dist/momentum.min.js')
	 .pipe(gzip())
	 .pipe(gulp.dest('./dist/'));

  gulp.src('./dist/debug/momentum.min.js')
   .pipe(gzip())
   .pipe(gulp.dest('./dist/debug/'));
});

gulp.task('build', gulpSequence(
  'dj-closure-compile-main',
  'dj-closure-compile-debug',
  'compress-js'
));

gulp.task('server', () => {
  return connect.server({
    root: ['./demos', './'],
    livereload: true,
    port: 8000
  });
});

gulp.task('start', () => {
	gulp.start('dj-closure-deps-watch', 'server');
});

gulp.task('default', ['build']);