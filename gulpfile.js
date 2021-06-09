const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const del = require('del');
const rename = require('gulp-rename');
const webp = require('gulp-webp');
const webpHtml = require('gulp-webp-html');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fileInclude = require('gulp-file-include');
const htmlbeautify = require('gulp-html-beautify');

let fs = require('fs');
let source = './src';
let build = require('path').basename(__dirname);
console.log(build);

function browsersync() {
    browserSync.init({
        server: {baseDir: build + '/'},
        notify: false,
        online: true, //false - without inet
        browser: 'chrome'
    })
}

const html = () => {
    return src([source + '/*.html'])
        .pipe(fileInclude({
            prefix: '@',
            basepath: '@file'
        }))
        .pipe(webpHtml())
        .pipe(htmlbeautify())
        .pipe(dest(build))
        .pipe(browserSync.stream());
}

function cleandist() {
    return del(build + '/**/*', { force: true })
}

function styleLibs() {
    return src('node_modules/normalize.css/normalize.css')
        .pipe(rename('normalize.scss'))
        //.pipe(cleanCss(({ level: { 1: { specialComments: 0 } }}))) 
        .pipe(dest(source + '/scss/lib/'))
}

function styles() {
    return src(source + '/scss/main.scss')
        .pipe(sass())
        //.pipe(concat('main.css'))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
        .pipe(dest(build + '/css/'))
        .pipe(browserSync.stream())
        .pipe(cleanCss(({ level: { 1: { specialComments: 0 } }/*, format: 'beautify'*/ }))) /* specialComments: 0 -комментарии, format: 'beautify' - развернутый вид */
        .pipe(rename({ extname: '.min.css' }))
        .pipe(dest(build + '/css/'))
        .pipe(browserSync.stream());
}

function fonts() {
    src(source + '/fonts/*')
        .pipe(ttf2woff())
        .pipe(dest(build + '/fonts/'));
    return src(source + '/fonts/*')
        .pipe(ttf2woff2())
        .pipe(dest(build + '/fonts/'));
}

async function fontsStyle(params) {

    let file_content = fs.readFileSync(source + '/scss/_fonts.scss');
    if (file_content == '') {
        fs.writeFile(source + '/scss/_fonts.scss', '', cb);
        return fs.readdir(build + '/fonts/', function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source + '/scss/_fonts.scss', '@include font-face("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}

function scripts() {
    return src(source + '/scripts/js/main.js')
    .pipe(fileInclude({
        prefix: '@',
        basepath: '@file'
    }))
    .pipe(dest(build + '/scripts/js/'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest(build + '/scripts/js/'))
    .pipe(browserSync.stream())
}

function images() {
    return src(source + '/media/img/**/*')
    .pipe(newer(build + '/media/img/'))
    .pipe(webp({ quality: 70 }))
    .pipe(dest(build + '/media/img/'))
    .pipe(src(source + '/media/img/**/*'))
    .pipe(imagemin())
    .pipe(dest(build + '/media/img/'))
}

function cleanimg() {
    return del(build + '/media/img/**/*', { force: true })
}

function startWatch() {
    watch([source + '/scss/main.scss'], styles);
    watch([source + '/scripts/**/*.js'], scripts);
    //watch(source + '/**/*.html').on('change', browserSync.reload);
    watch([source + '/**/*.html'], html);
    watch([source + '/media/img/**/*'], images);
}


exports.html = html;
exports.styleLibs = styleLibs;
exports.styles = styles;
exports.cleandist = cleandist;
exports.fonts = fonts;
exports.fontsStyle = fontsStyle;
exports.scripts = scripts;
exports.images = images;
exports.cleanimg = cleanimg;


exports.build = series(cleandist, styles, scripts, images);
exports.default = parallel(html, series(styleLibs, styles), scripts, series(fonts, fontsStyle, styles), series(images, html), browsersync, startWatch);

//let ffont = gulp.series(fonts, fontsStyle)