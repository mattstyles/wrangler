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
    t.plan( 5 );

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

    users.create({
        name: 'Kirk'
    }, {
        cache: false
    });

    t.equal( users.cache.length, 2, 'Setting cache:false on create options should not cache a model' );
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
 * Factory::parse
 */
test( 'Factory:parse should turn a db model into a real model', function( t ) {
    t.plan( 3 );

    var users = wrangler.createFactory( 'user', {} );
    var dbmodel = {
        name: 'Chas',
        id: 'uniqueid'
    };
    var model = users.parse( dbmodel );

    t.equal( dbmodel.name, model.name, 'Name should match' );
    t.equal( dbmodel.id, model.id, 'Ids should match' );

    t.throws( function() {
        users.parse( {} );
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

test( 'Factory:find options should specify no-cache retrieval', function( t ) {
    t.plan( 2 );

    var users = wrangler.createFactory( 'user', {} );

    // Dont cache this model, if there are no locals it will only
    // call _findCacheIndex once per find (a 2nd call will happen if it is
    // found locally during the refresh from server phase)
    var model = users.create({
        name: 'Chas'
    }, {
        cache: false
    });

    // Spy on users._findCacheIndex
    var original = users._findCacheIndex;
    var spy = {
        callCount: 0,
        run: function( model ) {
            spy.callCount++;
            return original.call( users, model );
        }
    };
    users._findCacheIndex = spy.run;

    // users.find( model.id );
    model.save()
        .then( function() {
            users.find( model.id )
                .then( function() {
                    t.equal( spy.callCount, 1, 'Default find should check the cache' );
                })
                // Cascade to ensure last find has finished
                .then( function() {
                    users.find( model.id, {
                        cache: false
                    })
                        .then( function() {
                            // Spy call count should be the same i.e. 1, meaning this find has not called it
                            t.equal( spy.callCount, 1, 'Find with cache:false should not try to grab from cache' );
                        })
                        .catch( t.fail );
                })
                .catch( t.fail );
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

    t.on( 'end', function() {
        if ( localWrangler && localWrangler.close ) {
            localWrangler.close();
        }
    });
});


/**
 * Private methods
 */
test( 'Factory::cache methods should manipulate the cache', function( t ) {
    t.plan( 11 );

    var localLevel = levelup( path.join( os.tmpdir(), 'level-wrangler-' + Math.random() ), {
        encoding: 'json'
    });
    var localWrangler = new Wrangler( localLevel );

    var users = localWrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Chas'
    });
    var model2 = users.create({
        name: 'Dave'
    });

    t.equal( users.cache.length, 2, 'First created model should be cached' );

    t.equal( users._findCacheIndex( model ), 0, 'Should be able to find a cached models index' );
    t.equal( users._findCacheIndex( model2 ), 1, 'Should be able to find a cached models index' );

    t.equal( users.cache[ 0 ].name + 'And' + users.cache[ 1 ].name, 'ChasAndDave', 'Cache should maintain order' );

    users._removeFromCache( model );

    t.equal( users.cache.length, 1, 'removing a model from cache should reduce cache length' );
    t.equal( users._findCacheIndex( model2 ), 0, 'Removing from cache will update cache index' );

    t.throws( function() {
        users._removeFromCache({
            name: 'nope'
        });
    }, 'Removing a non-existent model should throw' );

    t.throws( function() {
        users._removeFromCache();
    }, 'Failing to supply a model to remove from cache should throw' );

    var model3 = users.create({
        name: 'Ruprect'
    }, {
        cache: false
    });

    t.equal( users.cache.length, 1, 'Specifying uncached on model creation should not cache' );

    users._pushToCache( model3 );

    t.equal( users.cache.length, 2, 'pushing to cache should add the model to cache' );
    t.equal( users.cache[ users.cache.length - 1 ].name, 'Ruprect', 'pushing to cache should add the correct model to the end of the cache array' );

    t.on( 'end', function() {
        if ( localWrangler && localWrangler.close ) {
            localWrangler.close();
        }
    });
});
