var os = require( 'os' );
var path = require( 'path' );

var test = require( 'tape' );

var dbpath = path.join( os.tmpdir(), 'level-wrangler-' + Math.random() );

var level = require( 'level' )( dbpath, {
    encoding: 'json'
});
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


test( 'Factory:serialize should prepare a model for saving as json', function( t ) {
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


test( 'Factory:save should save a serialized model', function( t ) {
    t.plan( 1 );

    var users = wrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Chas'
    });

    model.save()
        .then( function() {
            level.get( model.id, function( err, res ) {
                if ( err ) {
                    t.fail( err );
                }

                t.equal( res.name, 'Chas', 'saved object props match model props' );
            });
        })
        .catch( t.fail );

});


test( 'Factory:remove should remove a model', function( t ) {
    t.plan( 1 );

    var users = wrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Chas'
    });

    model.save()
        .then( function() {
            return model.remove();
        })
        .then( function() {
            level.get( model.id, function( err, res ) {
                if ( err ) {
                    if ( err.notFound ) {
                        return t.ok( 'Model was removed from the db' );
                    }

                    return t.fail( err );
                }

                t.fail( 'Model was not removed' );
            });
        })
        .catch( t.fail );
});


test( 'Factory:find should grab a saved model', function( t ) {
    t.plan( 5 );

    var users = wrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Chas'
    });

    model.save()
        .then( function() {
            users.find( model.id )
                .then( function( res ) {
                    t.equal( res.name, 'Chas', 'found object props match model props' );

                    t.doesNotThrow( function() {
                        t.ok( res instanceof ModelClass, 'Found instance should be a Model' );
                        t.equal( res.name, 'Chas', 'Newly created model props match found instance' );
                        t.notEqual( model.id, res.id, 'Newly created model has unique id' );
                    }, 'New model can be created from found instance' );
                })
                .catch( t.fail );
        })
        .catch( t.fail );
});


test( 'Factory:findAll should grab everything in the db', function( t ) {
    // the previous tests will have dumped some stuff in the db
    // this means this test is linked to the last @TODO fix, test deps suck
    t.plan( 3 );

    var users = wrangler.createFactory( 'user', {} );
    users.findAll()
        .then( function( res ) {
            t.equal( res.length, 2, 'findAll should return an array of resources' );
            t.ok( res[ 0 ] instanceof ModelClass, 'findAll should return Models' );
            t.equal( res[ 0 ].name + res[ 1 ].name, 'ChasChas', 'findAll should return the saved models' );
        });
});
