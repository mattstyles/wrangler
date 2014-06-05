#!/usr/bin/env node

var Wrangler = require( '../' ),
    rimraf = require( 'rimraf' ),
    argv = require( 'minimist' )( process.argv.slice( 2 ) ),
    chalk = require( 'chalk' ),

    db = './db';

process.on( 'exit', function( status ) {
    console.log( '\nExiting...' );

    if ( argv.c ) {
        console.log( chalk.blue( 'Removing db' ) );
        rimraf.sync( db );
    }
});


var wrangler = Wrangler({
    db: db,
    sep: 'X',
    schema: {
        username: {
            // true by default
            // adds an index using username
            index: true,
            // schema will throw an error if this attrib is omitted
            required: true
        },
        password: {
            // does not create an index for this attribute
            index: false,
            // called for every put operation to transform data
            hook: function( val, ctx ) {
                var sep = ctx ? ctx.sep : '';
                return [
                    sep,
                    val || '',
                    sep,
                    Date.now(),
                    this.test
                ].join( '' );
            },

            test: '--TEST--'
        },
        email: {
            // default value if none is supplied
            default: 'email address'
        }
    }
});

wrangler.addModel({
    id: 'Users'
});

wrangler.db.put( 'mykey', {foo:'foo'}, function( err ) {
    if ( err ) {
        console.log( 'db', err );
    }

    wrangler.models[ 0 ].level.put( 'userkey', { bar: 'bar' }, function( err ) {
        if ( err ) {
            console.log( 'user:', err );
        }

        console.log( '\n all done \n' );
        console.log( wrangler );
    });
});
