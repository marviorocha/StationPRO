'use strict';
 
const {src, dest, parallel, watch} = require('gulp');
const sass                         = require('gulp-sass');
const minifyCSS                    = require('gulp-csso');
const concat                       = require('gulp-concat');

  
function css() {
  return src('./assets/sass/**/*.scss')
   
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('style.min.css'))
    .pipe(minifyCSS())
    .pipe(dest('./assets/css'));
};

function js(){
  return src('./assets/js/**/*.js')
  .pipe(concat('all.js'))
  .pipe(gulp.dest('./assets/js/'));

}

exports.css = css;
exports.default = function () {
  watch('./assets/sass/**/*.scss', parallel(css));
};