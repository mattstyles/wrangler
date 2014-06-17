/**
 *   Wrangler
 * © 2014 Matt Styles @personalurban
 */


var Level = require( 'level-promisify' ),
    _ = require( 'lodash-node' ),
    Promise = require( 'es6-promise' ).Promise,

    Model = require( './model' );


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
            return new Model({
                id: model,
                schema: null
            });
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
                    return onModels();
                }

                reject( err );
            })
            // Continue processing now we've got some models
            .then( function( wrangler ) {

                // Loop over supplied models and add them
                Promise.all( _.map( opts.models, function( model ) {
                    return wrangler.addModel( model );
                }))
                    .then( function( results ) {
                        // results have already been added to self.models so just return self
                        resolve( wrangler );
                    })
                    .catch( function( err ) {
                        if ( err.exists ) {
                            return resolve( wrangler );
                        }

                        // Otherwise it is a genuine error
                        reject( err );
                    });
            });
    }.bind( this ));
};


/**
 * Wrangler prototype functions
 */
Wrangler.prototype = {

    /**
     * Adds a model definition to the db
     *
     * Models may already have been registered with the db, in which case this function adds a model
     * object to them which in turn means they are ready to be used. Otherwise this.models will contain
     * a list of models which are registered but not ready to use (denoted by model:null).
     *
     * @param model {Object} the model object to add to wrangler, this will also be registered with the db
     * @returns Promise {model} resolves with the model that was added
     */
    addModel: function( model ) {

        // Creates the model - basically just gets it ready to be used
        var createModel = function( model ) {
            // Add the db to the model, all ready for querying
            model._db = this.db.sublevel( model.id, {
                sync: true
            });

            // Add it to the models array if it is a completely new model
            if ( !this.models.length || !_.find( this.models, { id: model.id } ) ) {
                this.models.push( model );
            } else {
                // If we got here then we're updating a pre-existing model
                this.models[ _.findKey( this.models, { id: model.id } ) ] = model;
            }

            return model;
        }.bind( this );

        // Return a promise which resolves with the instantiated model
        return new Promise( function( resolve, reject ) {
            // Check for existing model
            if ( _.find( this.models, { id: model.id } ) ) {

                // Even though it exists it probably isnt registered with the actual model definition so create it now
                return resolve( createModel( model ) );
            }

            // Create the model
            createModel( model );

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
     *
     * @returns Promise {array of strings} contains id's of registered models
     */
    getModels: function() {
        return this.meta.get( 'models' );
    }


}
