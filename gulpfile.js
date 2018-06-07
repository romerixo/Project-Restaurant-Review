const gulp = require('gulp'),
    runSequence = require('run-sequence'),
    uglify = require('gulp-uglifyes'),
    clean = require('gulp-clean'),
    responsive = require('gulp-responsive'),
    cleanCSS = require('gulp-clean-css'),
    gzip = require('gulp-gzip'),
    babel = require('gulp-babel');


gulp.task('copy-html', function(){
    gulp.src('./*.html')
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'))
});

gulp.task('copy-js', function(){
    gulp.src('./*.js')
    .pipe(babel({presets: ['env']}))
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'))
});

gulp.task('compress-css', function(){
    gulp.src('./css/*.css')
    .pipe(cleanCSS())
    .pipe(gzip())
    .pipe(gulp.dest('./dist/css/'));
});

gulp.task('compress-js', function(){
    gulp.src('./js/**/*.js')
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest('./dist/js/'));
});

gulp.task('responsive-img', function(){
    gulp.src('img_src/*.{jpg,png}')
    .pipe(responsive({
        '*': [
            {width: 1600, rename: {suffix: '-large-2x', extname: '.webp'}, quality: 80},
            {width: 800, rename: {suffix: '-large', extname: '.webp'}, quality: 60},
            {width: 460, rename: {suffix: '-medium', extname: '.webp'}, quality: 60},
        ]
    },{
        // default values
        withMetadata: false,
        progressive: true,
        errorOnEnlargement: false,
    }))
    .pipe(gulp.dest('./dist/img/'))
});

gulp.task('fixed-img', function(){
    gulp.src('./img_src/fixed/*')
    .pipe(gulp.dest('./dist/img/'));
});

gulp.task('clean-dist', function(){
    return gulp.src('./dist/*')
    .pipe(clean({read: false, force: true}))
});

gulp.task('dist', function(){
    runSequence(
        'clean-dist',     
        'copy-html', 
        'copy-js', 
        'compress-css', 
        'compress-js', 
        'responsive-img', 
        'fixed-img'
    );
});
