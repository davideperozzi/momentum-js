const gulp = require('gulp');
const path = require("path");
const gzip = require('gulp-gzip');
const argv = require('yargs').alias('d', 'dist').argv;
const express = require('express');
const compression = require("compression")
const closureCompiler = require('google-closure-compiler').gulp();

gulp.task('build-js', () => {
	return closureCompiler({
		js: [
			'./node_modules/google-closure-library/closure/goog/base.js',
			'./src/momentum.js'
		],
		define: 'COMPILED=true',
		generate_exports: '1',
		compilation_level: 'ADVANCED',
		warning_level: 'VERBOSE',
		language_in: 'ECMASCRIPT5_STRICT',
		language_out: 'ECMASCRIPT5_STRICT',
		js_output_file: 'momentum.min.js',
		closure_entry_point: 'momentum',
		externs: ['./etc/momentum.externs.js']
	})
	.src()
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
	var app = express();

	app.use(compression());
	app.get('/', (req, res) => {
		res.sendFile(path.join(__dirname + '/demos/index.html')); 
	});

	app.get('/momentum', (req, res) => {
		if (argv.dist) {
	    	res.sendFile(path.join(__dirname + '/dist/momentum.min.js')); 
		}
		else {
	    	res.sendFile(path.join(__dirname + '/src/momentum.js')); 
		}
	});

	for (var i = 1, len = 4; i <= len; i++) {
		app.get('/demo/' + i, function(num, req, res){
		    res.sendFile(path.join(__dirname + '/demos/demo' + num + '.html'));
		}.bind(this, i));
	}

	app.listen(3000);
});

gulp.task('default', ['build']);