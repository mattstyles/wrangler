var os = require( 'os' );
var path = require( 'path' );

var test = require( 'tape' );

var dbpath = path.join( os.tmpdir(), 'level-wrangler-' + Math.random() );

var level = require( 'level' )( dbpath );
var wrangler = require( '../dist' )( level );

var FactoryClass = require( '../dist/model/factory' );
var ModelClass = require( '../dist/model/model' );


test( 'create new Factory', function( t ) {
    t.plan( 1 );

    var factory = wrangler.createFactory( 'test', {} );

    t.ok( factory instanceof FactoryClass, 'called without new' );
});


test( 'Factories should be able to create Model instances', function( t ) {
    t.plan( 4 );

    var users = wrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Chas'
    });

    t.ok( model instanceof ModelClass, 'Factory creates Models' );
    t.ok( model.name === 'Chas', 'model is assigned properties' );
    t.ok( users.cache.length === 1, 'model has been added to factory cache' );

    var model2 = users.create({
        name: 'Dave'
    });

    t.ok( users.cache.length === 2, 'a second model has been added to factory cache' );
});


test( 'Models should be assigned a unique id upon creation', function( t ) {
    t.plan( 1 );

    var users = wrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Dave'
    });

    t.ok( model.id.length > 8, 'Id assigned to model' );
});
