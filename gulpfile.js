const gulp = require('gulp');
const path = require("path");
const gzip = require('gulp-gzip');
const argv = require('yargs').alias('d', 'dist').argv;
const connect = require('gulp-connect');
const closureDeps = require('gulp-closure-deps');
const compression = require("compression")
const closureCompiler = require('google-closure-compiler').gulp();

gulp.task('deps-js', () => {
	return gulp.src('./src/**/*.js')
		.pipe(closureDeps({
			fileName: 'momentum.deps.js',
			prefix: '../../../../'
		}))
		.pipe(gulp.dest('./etc'))
});

gulp.task('build-js', () => {
	return gulp.src([
      './node_modules/google-closure-library/closure/goog/base.js',
      './src/**/*.js'
    ]).pipe(closureCompiler({
  		generate_exports: '1',
  		compilation_level: 'ADVANCED',
  		warning_level: 'VERBOSE',
  		language_in: 'ECMASCRIPT5_STRICT',
  		language_out: 'ECMASCRIPT5_STRICT',
  		js_output_file: 'momentum.min.js',
  		closure_entry_point: 'momentum',
  		externs: ['./etc/momentum.externs.js']
	}))
	.pipe(gulp.dest('./dist/'));
});

gulp.task('compress-js', () => {
	return gulp.src('./dist/momentum.min.js')
	    	   .pipe(gzip())
	    	   .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['build-js'], () => {
	return gulp.start('compress-js');
});

gulp.task('start', () => {
	return connect.server({
		root: ['./demos', './'],
		livereload: true,
		port: 8000
	});
});

gulp.task('default', ['build']);