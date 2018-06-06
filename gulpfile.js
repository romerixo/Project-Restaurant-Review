const gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    responsive = require('gulp-responsive');


const dirs = {
    'dev': './',
    'prod': './dist/'
}

gulp.task('test', function(){
    gulp.src('js/test.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('copy-html', function(){
    gulp.src('./*.html')
    .pipe(gulp.dest('./dist/'))
});

gulp.task('images', function(){
    gulp.src('img_src/*')
    .pipe(responsive({
        '*': [
            {width: 1600, rename: {suffix: '-large-2x'}, quality: 80},
            {width: 800, rename: {suffix: '-large'}, quality: 60},
            {width: 460, rename: {suffix: '-medium'}, quality: 60},
        ]
    },{
        // default values
        withMetadata: false,
        progressive: true,
        errorOnEnlargement: false,
    }))
    .pipe(gulp.dest('dist/img'))
});

