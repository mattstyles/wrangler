var os = require( 'os' );
var path = require( 'path' );

var test = require( 'tape' );
var dbpath = path.join( os.tmpdir(), 'level-wrangler-' + Math.random() );

var level = require( 'level' )( dbpath );
var Wrangler = require( '../dist' );

var FactoryClass = require( '../dist/model/factory' );


/**
 * new Wrangler
 */
test( 'connect', function( t ) {
    t.plan( 1 );

    var wrangler = null;

    try {
        wrangler = new Wrangler( level );
        t.ok( true, 'Sync create ok' );
    } catch( err ) {
        t.fail( err );
    }

    t.on( 'end', function() {
        if ( wrangler && wrangler.close ) {
            wrangler.close();
        }
    });
});


/**
 * Wrangler::createFactory
 */
test( 'create new Factory', function( t ) {
    t.plan( 1 );

    var factory, wrangler;
    try {
        wrangler = new Wrangler( level );
        factory = wrangler.createFactory( 'test', {} );

        t.ok( factory instanceof FactoryClass, 'called without new' );
    } catch( err ) {
        t.fail( err );
    }

    t.on( 'end', function() {
        if ( wrangler && wrangler.close ) {
            wrangler.close();
        }
    });
});
