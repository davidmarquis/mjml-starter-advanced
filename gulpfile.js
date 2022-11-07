const config = require('./config');
const gulp = require('gulp');
const argv = require('yargs').argv;
const mjml = require('gulp-mjml');
const tap = require('gulp-tap');
const i18n = require('gulp-html-i18n');
const replace = require('gulp-replace');
const environments = require('gulp-environments');
const connect = require('gulp-connect');
const nunjucks = require('gulp-nunjucks');
const clean = require('gulp-clean');

const I18N_REGEX = /\_\(([\w-\.+]+)\)/g;    // used to find placeholder for i18n keys in templates

const production = environments.production;

const mjmlEngine = require('mjml');

let assetBaseUrl = production() ? config.assetBaseUrl : './assets';
if (!assetBaseUrl) throw new Error(`Empty assetBaseUrl in config.js`)
if (assetBaseUrl.endsWith('/')) assetBaseUrl = assetBaseUrl.replace(/\/$/, "") // remove trailing slash

const argOutput = argv.out || './output';

const dirs = {
    output: argOutput,
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

gulp.task('clean', function () {
    return gulp.src('output/**', { read: false })
        .pipe(clean());
});

gulp.task('copy:assets', function () {
    return gulp.src(files.assets)
        .pipe(gulp.dest(dirs.output_assets))
});

gulp.task('build:html', function () {
    return gulp.src(files.templates)
        .pipe(nunjucks.compile({
            assetBaseUrl
        }, {
            searchPath: dirs.templates
        }))
        .pipe(mjml(mjmlEngine, {
            minify: false,
            filePath: dirs.templates,
            // validationLevel: 'strict'
        }))
        .pipe(i18n({
            langDir: dirs.locales,
            langRegExp: I18N_REGEX,
        }))
        .pipe(gulp.dest(dirs.output))
        .pipe(connect.reload())
});

gulp.task('build:text', function () {
    return gulp.src(files.templates_text)
        .pipe(nunjucks.compile({
            assetBaseUrl
        }, {
            searchPath: dirs.templates_text
        }))
        .pipe(i18n({
            langDir: dirs.locales,
            langRegExp: I18N_REGEX,
        }))
        .pipe(gulp.dest(dirs.output))
        .pipe(connect.reload());
});

gulp.task('build', gulp.series(['clean', 'copy:assets', 'build:text', 'build:html']));

gulp.task('watch', gulp.series(['build'], function () {
    gulp.watch([files.templates_all, files.assets, files.locales], gulp.series(['build:html']));
    gulp.watch([files.templates_text_all, files.locales], gulp.series(['build:text']));
}));

gulp.task('server', function () {
    connect.server({
        root: dirs.output,
        port: 1980,
        livereload: true
    });
});

gulp.task('default', gulp.parallel(['server', 'watch']));
