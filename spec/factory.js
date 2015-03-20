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
    t.equal( model.name, 'Chas', 'model is assigned properties' );
    t.equal( users.cache.length, 1, 'model has been added to factory cache' );

    users.create({
        name: 'Dave'
    });

    t.equal( users.cache.length, 2, 'a second model has been added to factory cache' );
});


test( 'Factory:Serialize should prepare a model for saving as json', function( t ) {
    t.plan( 6 );

    var users = wrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Chas'
    });

    var s = users.serialize( model );

    t.equal( typeof s, 'object', 'Serialize should return an object' );
    t.equal( s.name, 'Chas', 'Saveable props should be available after serialization' );
    t.equal( typeof s.save, 'undefined', 'Serialize should strip prototype functions' );
    t.equal( typeof s._factory, 'undefined', 'Serialize should strip prototype private props' );

    var model2 = users.create({
        name: 'Dave',
        speak: function( say ) {
            console.log( say );
        },
        _private: 'This is private and ignored'
    });

    t.equal( typeof users.serialize( model2 ).speak, 'undefined', 'Serialize should strip functions from models' );
    t.equal( typeof s._private, 'undefined', 'Serialize should strip private props' );

});
