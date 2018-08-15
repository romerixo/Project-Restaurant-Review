const gulp = require('gulp'),
  livereload = require('gulp-livereload'),
  runSequence = require('run-sequence'),
  uglify = require('gulp-uglifyes'),
  clean = require('gulp-clean'),
  responsive = require('gulp-responsive'),
  cleanCSS = require('gulp-clean-css'),
  gzip = require('gulp-gzip'),
  babel = require('gulp-babel');


const dirs = {
  dev: '.',
  prod: './dist'
}

let target = dirs.prod; // DEFAULT MODE

gulp.task('copy-html', function(){
  gulp.src('./*.html')
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'))
});

gulp.task('copy-manifest', function(){
  gulp.src('./manifest.json')
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
    .pipe(gulp.dest(`${target}/img/`))
});

gulp.task('fixed-img', function(){
  gulp.src('./img_src/fixed/*')
    .pipe(gulp.dest(`${target}/img/`));
});

gulp.task('clean-dist', function(){
  return gulp.src('./dist/*')
    .pipe(clean({read: false, force: true}))
});

gulp.task('clean-img', function(){
  return gulp.src(`${target}/img/*`)
    .pipe(clean({read: false, force: true}))
});

gulp.task('build:dist', function(){
  runSequence(
    'clean-dist',     
    'copy-html', 
    'copy-manifest', 
    'copy-js', 
    'compress-css', 
    'compress-js', 
    'responsive-img', 
    'fixed-img'
  );
});

gulp.task('build', function(){
  target = dirs.dev;
  runSequence('clean-img', 'responsive-img', 'fixed-img');
});

gulp.task('reload', function(){
  gulp.src(['*.html', 'js/*.js', 'css/*.css'])
    .pipe(livereload());
});

gulp.task('watch', function(){
  livereload.listen();
  gulp.watch(['*.html', 'js/*.js', 'css/*.css'], ['reload']);
});
