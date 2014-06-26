/**
 * model
 *
 * Defines a model that represents a discrete blob of data.
 *
 * The model should expose a few methods for finding and manipulating unique
 * model instances but should also be able to create and return an instance of
 * a specific model to work with.
 *
 * @todo - index values should be unique, so a non-unique value used as an index
 * should throw an error. Currently it'll overwrite the index, write a new object
 * but keep the old, unindexed object in the db.
 */

var util = require( 'util' ),
    EventEmitter = require( 'EventEmitter3' ),
    Promise = require( 'es6-promise' ).Promise,
    _ = require( 'lodash-node' ),
    uuid = require( 'node-uuid' ),

    ModelBase = require( './model/base' ),
    ModelInstance = require( './model/instance' ),
    ChangeRecord = require( './model/change-record' ).ChangeRecord,
    ChangeRecordCtrl = require( './model/change-record' ).ChangeRecordCtrl;

/**
 * Model Constructor function
 *
 * @param opts {object}
 *    id {String}
 *    schema {Schema} the schema for the model
 */
var ModelCtrl = module.exports = function( opts ) {

    if ( !opts ) {
        throw new Error( 'Models should be defined by a schema' );
    }

    ModelBase.call( this );

    this.opts = opts;
    this.id = opts.id;
    this._schema = opts.schema;
};


util.inherits( ModelCtrl, ModelBase );

_.extend( ModelCtrl.prototype, {

    /**
     * The database level instance associated with model.
     *
     * @private
     * @type {Sublevel}
     */
    _db: null,


    /**
     * The sublevel associated with indexable data.
     *
     * @private
     * @type {Sublevel}
     */
    _index: null,


    /**
     * The schema associated with this model type
     *
     * @private
     * @type {Schema}
     */
    _schema: null,


    /**
     * The separator used to generate index keys
     *
     * @private
     * @type {String}
     */
    _sep: '\xff',


    /**
     * Checks to see if a db has been registered with this model
     *
     * @return {Boolean}
     */
    ready: function() {
        return !!this._db && !!this._schema;
    },


    /**
     * Creates a unique instance of the model
     *
     * @param opts {Object}
     *   sync {Boolean} synchronous or asynchronous call
     *   model {Object} the model to use to populate the actual model
     * @return {ModelInstance} either returns the actual instance or wraps it in a promise
     */
    create: function( opts ) {
        var opts = opts || {};

        if ( !this.ready() ) {
            console.log( 'Model not ready to be created - does it have an associated db and schema?' );
        }

        var model = new ModelInstance({
            schema: this._schema,
            db: this._db,
            sep: this._sep,
            model: opts.model
        });

        return opts.sync ? model : Promise.resolve( model );
    },


    /**
     * Finds a value in the db.
     * Currently accepts just a single key-value pair to search against.
     * @todo should accept a uuid to return, should accept multiple keys (indices) to search against,
     * and should accept a range.
     *
     * @param term {Object} key-value pair to search for using the key as an index
     * @return {ModelInstance}
     */
    find: function( term ) {
        return new Promise( function( resolve, reject ) {

            // Bail if no term is supplied
            if ( !term ) {
                reject( new Error( 'Model.find requires a search term' ) );
            }

            var keys = _.keys( term ),
                id = term.id || term.uuid;

            // Return by id if supplied
            if ( id ) {
                resolve( this._createModelFromID( id ) );
            }


            if ( keys.length > 1 ) {
                reject( new Error( 'Model.find currently accepts just one search key' ) );
            }

            // Search the indices first and then use the uuid to find the model object
            this._findIndex( this.generateIndexKey( keys[ 0 ], term[ keys[ 0 ] ] ) )
                .then( this._findModel )
                .then( this._createFromModel )
                .then( resolve )
                .catch( function( err ) {
                    reject( new Error( 'Error finding item: ' + term + '\nError:' + err ) );
                });

        }.bind( this ));
    },


    /**
     * Returns all values related to an index.
     * @todo - this could get pretty big and returning a stream will probably be the best way to go
     * @todo - streaming should probably be the default method.
     * @todo - currently uses just the first index
     *
     * @param index {String || Array} can accept an array of indices to search
     * @returns {Array} of uuids of objects stored within this index
     */
    findAll: function( term ) {
        return new Promise( function( resolve, reject ) {

            // Takes an id and returns a promise containing an instantiated model
            var getModel = function( uuid ) {
                return this._createModelFromID( uuid );
            }.bind( this );

            // Find all ids from an index
            this._findAllIndex( term[ 0 ] )
                .then( function( results ) {

                    // Use the ids containing in the results to find a model in the db
                    // and then instantiate it
                    Promise.all( _.map( _.pluck( results, 'uuid' ), getModel ) )
                        .then( function( models ) {
                            console.log( 'found all models' );
                            resolve( models );
                        })
                        .catch( function( err ) {
                            console.log( 'error finding models' );
                            reject( err );
                        });
                })
                .catch( function( err ) {
                    console.log( 'error finding ids from indices' );
                    reject( err );
                })

        }.bind( this ) );
    },


    /**
     * Finds an index given a key
     *
     * @private
     * @param key {String} the index key to search for
     * @returns {Promise / uuid} the uuid of the matching index key
     */
    _findIndex: function( key ) {
        return this._index.get( key );
    },


    /**
     * Finds a model given a uuid.
     *
     * @private
     * @param uuid {String} the unique id for the model to look for
     * @returns {Promise / json} the saved json representation of the model
     */
    _findModel: function( uuid ) {
        return this._db.get( uuid );
    },


    /**
     * Finds all values within a given index
     *
     * @private
     * @param index {String} the index id to read through
     * @return {Promise / Array of uuids}
     */
    _findAllIndex: function( index ) {
        return new Promise( function( resolve, reject ) {
            var items = [];

            var onData = function( data ) {
                items.push({
                    key: data.key.replace( index + this._sep, '' ),
                    uuid: data.value
                });
            }.bind( this );

            var onError = function( err ) {
                console.log( 'Error reading index stream' );
                reject( err );
            }.bind( this );

            var onClose = function() {
                resolve( items );
            }.bind( this );


            this._index.createReadStream({
                start: index + this._sep + '\x00',
                end: index + this._sep + '\xff'
            })
                .on( 'data', onData )
                .on( 'error', onError )
                .on( 'close', onClose );

        }.bind( this ));
    },


    /**
     * Invokes create passing a representation of a model
     *
     * @private
     * @param model {Object} keys in the schema will be copied to the new ModelInstance
     * @returns {Promise / ModelInstance} resolves to an instantiated ModelInstance
     */
    _createFromModel: function( model ) {
        return this.create({
            model: model
        });
    },


    /**
     * Create a new model instance from an id
     *
     * @private
     * @param uuid {String} the id to try and grab from the db
     * @returns {Promise / ModelInstance} resolves to an instantiated ModelInstance
     */
    _createModelFromID: function( uuid ) {
        return new Promise( function( resolve, reject ) {
            this._findModel( uuid )
                .then( this._createFromModel )
                .then( function( model ) {
                    resolve( model );
                })
                .catch( function( err ) {
                    reject( err );
                });
        }.bind( this ));
    }

});
