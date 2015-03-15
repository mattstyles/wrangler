var os = require( 'os' );
var path = require( 'path' );

var test = require( 'tape' );

var dbpath = path.join( os.tmpdir(), 'level-wrangler-' + Math.random() );

var level = require( 'level' )( dbpath );
var wrangler = require( '../dist' )( level );

var FactoryClass = require( '../dist/model/factory' );
var ModelClass = require( '../dist/model/model' );


test( 'optional new Factory', function( t ) {
    t.plan( 2 );

    var Factory = new wrangler.Factory( 'test', {} );

    t.ok( Factory instanceof FactoryClass, 'called using new' );

    Factory = null;
    Factory = wrangler.Factory( 'test', {} );

    t.ok( Factory instanceof FactoryClass, 'called without new' );
});


test( 'Factories should be able to create Model instances', function( t ) {
    t.plan( 4 );

    var Factory = wrangler.Factory( 'user', {} );
    var model = Factory.create({
        name: 'Dave'
    });

    t.ok( model instanceof ModelClass, 'Factory creates Models' );
    t.ok( model.name, 'Dave', 'model is assigned properties' );
});
