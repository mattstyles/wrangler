var os = require( 'os' );
var path = require( 'path' );
var assert = require( 'assert' );

var test = require( 'tape' );

var dbpath = path.join( os.tmpdir(), 'level-wrangler-' + Math.random() );

var levelup = require( 'level' );
var level = levelup( dbpath, {
    encoding: 'json'
});
var Wrangler = require( '../dist' );
var wrangler = new Wrangler( level );

var ModelClass = require( '../dist/model/model' );


/**
 * Factory::create
 */
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


/**
 * Factory::serialize
 */
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


/**
 * Factory::deserialize
 */
test( 'Factory:deserialize should turn a db model into a real model', function( t ) {
    t.plan( 3 );

    var users = wrangler.createFactory( 'user', {} );
    var dbmodel = {
        name: 'Chas',
        id: 'uniqueid'
    };
    var model = users.deserialize( dbmodel );

    t.equal( dbmodel.name, model.name, 'Name should match' );
    t.equal( dbmodel.id, model.id, 'Ids should match' );

    t.throws( function() {
        users.deserialize( {} );
    }, 'Not passing an id throws' );
});


/**
 * Factory::save
 */
test( 'Factory:save should save a serialized model', function( t ) {
    t.plan( 2 );

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

    t.throws( function() {
        users.save( {} );
    }, 'Saving a model without an id should throw' );
});


/**
 * Factory::remove
 */
test( 'Factory:remove should remove a model', function( t ) {
    t.plan( 2 );

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
                try {
                    t.ok( err.notFound, 'Model was removed from the db' );
                } catch( err ) {
                    t.fail( err );
                }

            });
        })
        .catch( t.fail );

    t.throws( function() {
        users.remove( {} );
    }, 'Saving a model without an id should throw' );
});


/**
 * Factory:find
 */
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
                    t.ok( res instanceof ModelClass, 'Found instance should be a Model' );
                    t.equal( res.name, 'Chas', 'Newly created props match found instance' );
                    t.equal( model.id, res.id, 'Newly created model id matches found instance' );
                })
                .catch( t.fail );

            t.throws( users.find( 'unknownId' ), 'Unfound id will throw' );
        })
        .catch( t.fail );
});


/**
 * Factory::findAll
 */
test( 'Factory:findAll should grab everything in the db', function( t ) {
    t.plan( 1 );

    var localLevel = levelup( path.join( os.tmpdir(), 'level-wrangler-' + Math.random() ), {
        encoding: 'json'
    });
    var localWrangler = new Wrangler( localLevel );

    var users = localWrangler.createFactory( 'user', {} );

    Promise.all([
        users.create({name: '' + Math.random() }).save(),
        users.create({name: '' + Math.random() }).save(),
        users.create({name: '' + Math.random() }).save()
    ])
        .then( function() {
            return users.findAll();
        })
        .then( function( models ) {
            t.equal( models.length, 3, 'findAll should return an array of resources' );
        })
        .catch( t.fail );

    t.on( 'end', function() {
        if ( localWrangler && localWrangler.close ) {
            localWrangler.close();
        }
    });
});


test( 'Factory::findAll should grab the models from the db correctly', function( t ) {
    t.plan( 4 );

    var localLevel = levelup( path.join( os.tmpdir(), 'level-wrangler-' + Math.random() ), {
        encoding: 'json'
    });
    var localWrangler = new Wrangler( localLevel );

    var users = localWrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Dave',
        says: 'yuuup'
    });

    model.save()
        .then( function() {
            return users.findAll();
        })
        .then( function( models ) {
            t.equal( models.length, 1, 'findAll should return the sole instance in a db' );
            t.ok( models[ 0 ] instanceof ModelClass, 'findAll should return Model instances' );
            t.equal( model.id, models[ 0 ].id, 'findAll should return the stored id of a model' );
            t.deepEqual( model, models[ 0 ], 'findAll should return a model with all of its properties and model props' );
        })
        .catch( t.fail );
});
