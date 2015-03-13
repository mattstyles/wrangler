var os = require( 'os' );
var path = require( 'path' );

var test = require( 'tape' );

var dbpath = path.join( os.tmpdir(), 'level-wrangler-' + Math.random() );

var level = require( 'level' )( dbpath );
var wrangler = require( '../dist' )( level );

var Model = require( '../dist/model/model' );


test( 'optional new Model', function( t ) {
    t.plan( 2 );

    var model = new wrangler.Model( 'test', {} );

    t.ok( model instanceof Model, 'called using new' );

    model = null;
    model = wrangler.Model( 'test', {} );

    t.ok( model instanceof Model, 'called without new' );
});
