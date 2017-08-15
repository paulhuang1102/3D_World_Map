var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var connect = require('gulp-connect');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var cssMini = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');


gulp.task('sass', function() {
    var plugins = [
        autoprefixer({ browsers: ['last 2 version', '>5%', 'ie 8'] }),
    ];
    return gulp.src('app/sass/*.sass')
        .pipe(connect.reload())
        .pipe(plumber())
        .pipe(sass())
        .pipe(postcss(plugins))
        .pipe(gulp.dest('app/css'));
});

gulp.task('connect', function() {
   return connect.server({
       root: 'app',
       livereload: true
   }) ;
});

gulp.task('html', function() {
    return gulp.src('app/*.html')
        .pipe(connect.reload());
});

gulp.task('babel', function() {
    return gulp.src('app/js/*.js')
        .pipe(connect.reload())
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(babel({
            presets: ['es2015']
        }))
        // .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./app/dist'));
});

gulp.task('cssmini', function() {
    return gulp.src('app/css/*.css')
        .pipe(cssMini())
        .pipe(gulp.dest('app/css'))
});

gulp.task('watch', function() {
    gulp.watch(['app/sass/*.sass', 'app/*.html', 'app/js/*.js'], ['sass', 'html', 'babel']);
});

gulp.task('default', ['connect', 'watch']);