
var BUILD_DIR = 'build';

var gulp = require('gulp'),
	ts = require('gulp-typescript');

gulp.task('typescript', function() {
	console.log('Compiling typescript');
	return gulp.src(['src/*.ts'])
		.pipe(ts({
			typescript: require('typescript'), // Use a more recent version.
			module: 'amd'
		})).js.pipe(gulp.dest(BUILD_DIR))
});

// TODO: Add PNG-crush task?

gulp.task('watch', function() {
	gulp.watch('src/*.ts', ['typescript']);
	// TODO: Add graphics/html/js watch to copy.
});

gulp.task('copy', function() {
	return gulp.src([
		'src/graphics/*',
		'src/index.html',
		'src/main.js',
		'src/jquery.min.js'
	], {base: 'src'})
		.pipe(gulp.dest(BUILD_DIR));
});

gulp.task('default', ['typescript', 'copy', 'watch']);
