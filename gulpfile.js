const config = require('./config');
const gulp = require('gulp');
const argv = require('yargs').argv;
const mjml = require('gulp-mjml');
const i18n = require('gulp-html-i18n');
const replace = require('gulp-replace');
const environments = require('gulp-environments');
const connect = require('gulp-connect');
const nunjucks = require('gulp-nunjucks');

const I18N_REGEX = /\_\(([\w-\.+]+)\)/g;    // used to find placeholder for i18n keys in templates

const production = environments.production;

const mjmlEngine = require('mjml');

// should never end with a slash
const imageBase = production() ? config.imageBase : './assets';

const argOutput = argv.out || './output';

const dirs = {
    output: argOutput ,
    output_assets: argOutput + '/assets',
    locales: './src/locales',
    templates: './src/templates/html',
    templates_text: './src/templates/text',
    assets: './src/assets'
};
const files = {
    templates: dirs.templates + '/*.mjml',
    templates_all: dirs.templates + '/**/*.mjml',
    templates_text: dirs.templates_text + '/*.txt',
    templates_text_all: dirs.templates_text + '/**/*.txt',
    assets: dirs.assets + '/**/*',
    locales: dirs.locales + '/**/*.yaml'
};

gulp.task('copy:assets', function() {
    return gulp.src(files.assets)
        .pipe(gulp.dest(dirs.output_assets))
});

gulp.task('build:html', function() {
    return gulp.src(files.templates)
        .pipe(nunjucks.compile({}, {searchPath: dirs.templates}))
        .pipe(replace('$IMGBASE$', imageBase))                         // could be replaced with Nunjucks vars
        .pipe(mjml(mjmlEngine))
        .pipe(i18n({
            langDir: dirs.locales,
            langRegExp: I18N_REGEX,
        }))
        .pipe(gulp.dest(dirs.output))
        .pipe(connect.reload());
});

gulp.task('build:text', function() {
     return gulp.src(files.templates_text)
         .pipe(nunjucks.compile({}, {searchPath: dirs.templates_text}))
         .pipe(i18n({
             langDir: dirs.locales,
             langRegExp: I18N_REGEX,
         }))
         .pipe(gulp.dest(dirs.output))
         .pipe(connect.reload());
});

gulp.task('build', ['copy:assets', 'build:text', 'build:html']);

gulp.task('watch', ['build'], function() {
    gulp.watch([files.templates_all, files.assets, files.locales], ['build:html']);
    gulp.watch([files.templates_text_all, files.locales], ['build:text']);
});

gulp.task('server', ['watch'], function(event) {
    connect.server({
        root: dirs.output,
        port: 1980,
        livereload: true
    });
});

gulp.task('default', ['server']);