
'use strict';

var gulp = require( 'gulp' ),
    mocha = require( 'gulp-mocha' ),
    plumber = require( 'gulp-plumber' ),
    notify = require( 'gulp-notify' ),
    gutil = require( 'gulp-util' );


gulp.task( 'test', function() {
    return gulp
        .src( [
            'spec/**/*.js',
            '!spec/fixtures/**/*',
            '!spec/expected/**/*',
            '!spec/utils/**/*'
        ])
        .pipe( plumber( {
            errorHandler: notify.onError( 'Test error: <%= error.message %>' )
        }))
        .pipe( mocha({
            reporter: 'nyan',
            ui: 'tdd'
        }))
        .on( 'error', function( err ) {
            gutil.log( gutil.colors.red( err.message ) );
            this.emit( 'end' );
        });
});


gulp.task( 'default', [ 'test' ], function() {
    gutil.log( 'Finished running tests' );
});
