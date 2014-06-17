/**
 *   Wrangler
 * © 2014 Matt Styles @personalurban
 */


var Level = require( 'level-promisify' ),
    _ = require( 'lodash-node' ),
    Promise = require( 'es6-promise' ).Promise;


/**
 * Exposes a method of creating an instance
 *
 * @param opts {object|String}
 *   db {string|Level instance} the name of the db or the db instance
 *   sep {string} the separator
 * @returns {Wrangler} instantiated Wrangler instance
 */
module.exports = function( opts ) {

    var db;

    if ( !opts || ( _.isObject( opts ) ? opts && !opts.db : false ) ) {
        throw new Error( 'requires a leveldb instance or a name to create one' );
    }

    // Create or use leveldb instance
    if ( typeof opts === 'string' ) {
        db = Level( opts, {
            sync: true,
            sublevel: true,
            valueEncoding: 'json'
        });
    } else if ( opts instanceof Level ) {
        db = opts;
    } else {
        opts.db = typeof opts.db === 'string' ? Level( opts.db, {
            sync: true,
            sublevel: true,
            valueEncoding: 'json'
        }) : opts.db;
    }

    // Return new instance and define option defaults
    return new Wrangler( _.extend({
        db: db,
        sep: '\xff'
    }, typeof opts === 'object' ? opts : null ));
};


/**
 * Constructor function
 *
 * @param opts {object}
 */
var Wrangler = function( opts ) {

    this.opts = opts;
    this.db = opts.db;
    this.models = [];
    this.meta = this.db.sublevel( 'meta', {
        valueEncoding: 'json',
        sync: true
    });

    /**
     * Handles getting some models from the meta data of the db.
     * this.models should be an array of objects with a model id and a model, as
     * we're just retrieving from the db here the models wont be instantiated in memory
     * and will require being passed a schema.
     */
    var onModels = function( models ) {
        this.models = _.map( models, function( model ) {
            return {
                id: model,
                model: false
            };
        });
        return Promise.resolve( this );
    }.bind( this );

    /**
     * Constructor returns a promise which resolves to the ready-to-go Wrangler object
     */
    return new Promise( function( resolve, reject ) {
        this.getModels()
            // Handle getting some model ids back from the meta
            .then( onModels )
            // Handle errors getting models from metadata
            .catch( function( err ) {
                // Not found is non-fatal so just continue
                if ( err.notFound ) {
                    console.log( 'models metadata not found' );
                    return onModels();
                }

                console.log( 'error getting models from meta data' );
                reject( err );
            })
            // Continue processing now we've got some models
            .then( function( wrangler ) {

                // Test adding a model
                // @todo loop through all models specified in the opts and add them all
                wrangler.addModel({
                    id: 'Test',
                    schema: {
                        testy: 'testing schema'
                    }
                })
                    .then( function() {
                        console.log( '  models:\n', wrangler.models );
                        resolve( wrangler );
                    })
                    .catch( function( err ) {
                        if ( err.exists ) {
                            console.log( 'model already exists' );
                            return resolve( wrangler );
                        }

                        console.log( 'error thrown adding model', err );
                        reject( err );
                    })

            });
    }.bind( this ));


    // return new Promise( function( resolve, reject ) {
    //     // Store any models
    //     var self = this;
    //
    //     Promise.all( _.map( opts.models, function( model ) {
    //         return self.addModel( model );
    //     }))
    //         .then( function( results ) {
    //             // results have already been added to self.models so just return self
    //             resolve( self );
    //         })
    //         .catch( function( err ) {
    //             reject( err );
    //         });
    //
    // }.bind( this ));
};


/**
 * Wrangler prototype functions
 */
Wrangler.prototype = {

    /**
     * Adds a model definition to the db
     */
    addModel: function( model ) {

        return new Promise( function( resolve, reject ) {
            // Check for existing model
            if ( _.find( this.models, { id: model.id } ) ) {
                model._db = this.db.sublevel( model.id, {
                    sync: true
                });

                return reject({
                    msg: 'Model has already been added to wrangler',
                    exists: true
                });
            }

            // Create the model
            model._db = this.db.sublevel( model.id, {
                sync: true
            });

            // Add it to the models array
            if ( !this.models.length ) {
                this.models.push({
                    id: model.id,
                    model: model
                });
            } else {
                this.models[ _.findKey( this.models, { id: model.id } ) ].model = model;
            }

            // Sync models array with the db
            this.meta.put( 'models', _.pluck( this.models, 'id' ) )
                .then( function() {
                    resolve( model );
                })
                .catch( function() {
                    reject({
                        msg: 'Can not write to the db'
                    });
                });

        }.bind( this ));
    },

    /**
     * Alias for adding a model
     */
    setModel: function( model ) {
        return this.addModel( model );
    },

    /**
     * Returns an array of the model ids used by the master db
     */
    getModels: function() {
        return this.meta.get( 'models' );
    }


}
