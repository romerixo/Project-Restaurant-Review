const gulp = require('gulp'),
  livereload = require('gulp-livereload'),
  uglify = require('gulp-uglifyes'),
  clean = require('gulp-clean'),
  responsive = require('gulp-responsive'),
  cleanCSS = require('gulp-clean-css'),
  sourcemaps = require('gulp-sourcemaps'),
  gzip = require('gulp-gzip'),
  babel = require('gulp-babel');


const dirs = {
  dev: '.',
  prod: './dist'
}

let target = dirs.prod; // DEFAULT MODE

gulp.task('compress-html', function(done){
  gulp.src('./*.html')
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'))
  done();
});

gulp.task('copy-manifest', function(done){
  gulp.src('./manifest.json')
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'))
  done();
});

gulp.task('copy-js', function(done){
  gulp.src(['./js/*.js'])
    .pipe(gulp.dest('./dist/js'))
  
  gulp.src(['./*.js'])
    .pipe(gulp.dest('./dist/'))
  done();
});

gulp.task('compress-css', function(done){
  gulp.src('./css/*.css')
    .pipe(cleanCSS())
    .pipe(gzip())
    .pipe(gulp.dest('./dist/css/'));
  done();
});

gulp.task('compress-js', function(done){
  gulp.src('./js/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest('./dist/js/'));

  gulp.src('./*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'));
  done();
});

gulp.task('responsive-img', function(done){
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

  done();
});

gulp.task('fixed-img', function(done){
  gulp.src('./img_src/fixed/*')
    .pipe(gulp.dest(`${target}/img/`));
  done();
});

gulp.task('clean-dist', function(done){
  return gulp.src('./dist/*')
    .pipe(clean({read: false, force: true}))
  done();
});

gulp.task('clean-img', function(done){
  return gulp.src(`${target}/img/*`)
    .pipe(clean({read: false, force: true}))
  done();
});

gulp.task('build:dist', gulp.series(
    'clean-dist',     
    'compress-html', 
    'copy-manifest', 
    'compress-css', 
    'compress-js', 
    'responsive-img', 
    'fixed-img'
));


//******************************************************************************
// Live reload tasks ***********************************************************
//******************************************************************************
gulp.task('reload', function(done){
  gulp.src(['*', 'js/*', 'css/*'])
  .pipe(livereload());

  done();
});

gulp.task('watch', function(){
  livereload.listen();
  gulp.watch(['*', 'js/*.js', 'css/*.css'], gulp.series('build:dist'));
});
