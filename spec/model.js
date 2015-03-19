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
    t.plan( 3 );

    var factory = new wrangler.Factory( 'user', {} );
    var model = factory.create({
        name: 'Dave'
    });

    t.ok( model instanceof ModelClass, 'Factory creates Models' );
    t.ok( model.name === 'Dave', 'model is assigned properties' );
    t.ok( factory.models.length === 1, 'model has been added to factory cache' );
});


test( 'Models should be assigned a unique id upon creation', function( t ) {
    t.plan( 1 );

    var factory = new wrangler.Factory( 'user', {} );
    var model = factory.create({
        name: 'Dave'
    });

    t.ok( model.id.length > 8, 'Id assigned to model' );
});
