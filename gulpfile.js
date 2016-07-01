var gulp = require('gulp');
var uglify = require('gulp-uglify');
var annotate = require('gulp-ng-annotate');
var concat = require('gulp-concat');
var del = require('del');
var rename = require('gulp-rename');

gulp.task('scripts-clean', function(done) {
  return del('./dist/**/*');
});

gulp.task('scripts', ['scripts-clean'], function(done) {
  return gulp.src('./src/**/*.js')
    .pipe(concat('angular-impress.js'))
    .pipe(gulp.dest('./dist'))
    .pipe(annotate())
    .pipe(uglify())
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['scripts']);