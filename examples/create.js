#!/usr/bin/env node

var rimraf = require( 'rimraf' ),
    argv = require( 'minimist' )( process.argv.slice( 2 ) ),
    chalk = require( 'chalk' ),

    Wrangler = require( '../' ),
    Model = require( '../lib/model' ),
    Schema = require( '../lib/schema' ),

    db = './db';

process.on( 'exit', function( status ) {
    console.log( '\nExiting...' );

    if ( argv.c ) {
        console.log( chalk.blue( 'Removing db' ) );
        rimraf.sync( db );
    }
});

var schema = new Schema({
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
});

schema.add({
    newProp: 'hello'
});

schema.remove( 'email' );

schema.add({
    bar: 'bar'
});

console.log( 'schema:', schema );


var wrangler;
Wrangler({
    db: db,
    sep: '\x00',
    models: [
        new Model({
            id: 'Users',
            schema: schema
        }),
        new Model({
            id: 'Sites',
            schema: {
                sitename: {
                    index: true
                }
            }
        })
    ]
}).then( function( wrangler ) {
    console.log( 'wrangler is ready to rock' );
    // console.log( wrangler );
}).catch( function( err ) {
    console.error( err );
});

// wrangler.addModel( new Model({
//     id: 'Users',
//     schema: schema
// }));
// wrangler.addModel( new Model({
//     id: 'Sites',
//     schema: {
//         sitename: {
//             index: true
//         }
//     }
// }));

// console.log( 'model:', wrangler.models[ 0 ] );
//
//
// wrangler.db.put( 'mynewkey', { foo: 'foo' }, function( err ) {
//     if ( err ) {
//         console.log( 'db', err );
//     }
//
//     wrangler.models[ 0 ]._db.put( 'userkey', [ 'bar', 'quux' ], function( err ) {
//         if ( err ) {
//             console.log( 'user:', err );
//         }
//
//         console.log( '\n all done \n' );
//         // console.log( 'wrangler:', wrangler );
//     });
// });
