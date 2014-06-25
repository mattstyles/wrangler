/**
 * Model Instance
 *
 * Model instances represent each instantiated model in the system.
 */


var util = require( 'util' ),
    Promise = require( 'es6-promise' ).Promise,
    _ = require( 'lodash-node' ),

    ModelBase = require( './base' ),
    ChangeRecord = require( './change-record' ).ChangeRecord,
    ChangeRecordCtrl = require( './change-record' ).ChangeRecordCtrl;


/**
 * Model Instance Constructor
 *
 * @inherits https://github.com/3rd-Eden/EventEmitter3
 * @param schema {Schema} the schema from which to create the model
 * @param opts {Object}
 *   db {LevelDB} the db instance to pass through
 *   sep {String} the separator to use to generate indices
 *   schema {Schema} the schema connected with the model
 *   model {Object} an object to use to create the new instance
 */
var ModelInstance = module.exports = function( opts ) {

    ModelBase.call( this );

    this._schema = opts.schema;
    this._sep = opts.sep;
    this.setDB( opts.db );

    // Create the change record object for this instance
    this._changes = new ChangeRecordCtrl();

    // Add each prop from the schema on to the instance
    _.each( opts.schema, function( val, key ) {
        this.addProp( key, val, opts.model )
    }, this );

}

util.inherits( ModelInstance, ModelBase );

/**
 * Model Instance Prototype
 */
_.extend( ModelInstance.prototype, {


    /*-----------------------------------------------------------*\
     *
     *  Members
     *
    \*-----------------------------------------------------------*/


    /**
     * Pointer to the instance of the db this model is connected to
     *
     * @private
     * @type {LevelDB}
     */
    _db: null,

    /**
     * Pointer to the sublevel of the db holding the indexable data
     *
     * @private
     * @type {SublevelDB}
     */
    _index: null,

    /**
     * Pointer to the instance of the schema associated with the model
     *
     * @private
     * @type {Schema}
     */
    _schema: null,

    /**
     * Manages the change records
     *
     * @private
     * @type {ChangeRecordCtrl}
     */
    _changes: null,

    /**
     * The separator used to generate index keys
     *
     * @private
     * @type {char}
     */
    _sep: '\xff',



    /*-----------------------------------------------------------*\
     *
     *  Methods
     *
    \*-----------------------------------------------------------*/


    /**
     * Adds a property to the model
     *
     * @param key {string} object key to set
     * @param def {Object} property definition - should be a schema prop def
     * @param model [optional] {Object} a model to use for values
     */
    addProp: function( key, def, model ) {
        var value = def.default || null;

        if ( model ) {
            value = model[ key ] || null;
        }

        this.emit( 'add:' + key, value );

        this._changes.push( new ChangeRecord({
            key: key,
            oldValue: null,
            newValue: value,
            index: def.index || false
        }));

        Object.defineProperty( this, key, {
            get: function() {
                return value;
            },

            set: function( val ) {
                // Set a change record
                this._changes.push( new ChangeRecord({
                    key: key,
                    oldValue: value,
                    newValue: val,
                    index: def.index || false
                }));

                value = val;

                // Fire change events
                if ( !def.silent ) {
                    this.emit( 'change:' + key, value );
                    var ret = {};
                    ret[ key ] = value;
                    this.emit( 'change', ret );
                }
            }
        });
    },

    /**
     * Saves the model to the db.
     * Searches the change records and updates index links to the actual model object,
     * then saves the model based upon its schema.
     *
     * It is up to the consumer to ensure that saving either creates a new model or
     * updates an existing one.
     *
     * @returns {Promise}
     */
    save: function() {
        return new Promise( function( resolve, reject ) {

            // Extracts indexable values from the change records and attempt to grab an ID
            // if a value exists in the db.
            // If is possible that multiple ID's can be returned from different indices,
            // this may be desireable to aggregate objects.
            Promise.all( _.map( this._changes.find( { index: true } ), this._findID ) )
                .then( this._saveModelByID  )
                .then( function( res ) {
                    resolve( res );
                })
                .catch( function( err ) {
                    reject( err );
                });
        }.bind( this ));
    },


    /*-----------------------------------------------------------*\
     *
     *  Helpers
     *
    \*-----------------------------------------------------------*/


    /**
     * Creates a saveable representation of the object, based upon the schema.
     *
     * @return {Object}
     */
    generateSaveItem: function() {
        var saveItem = {};

        _.each( this._schema, function( value, key ) {
            // Dont save silent schema props
            if ( !value.enumerable ) {
                return;
            }

            saveItem[ key ] = this[ key ];
        }, this );

        return saveItem;
    },


    /**
     * Uses a change record to try and find an id from an index
     *
     * @param record {ChangeRecord} the change record to search against
     * @returns {Promise / id || null} resolves to id or null if no index exists for the prop
     */
    _findID: function( record ) {
        return new Promise( function( resolve, reject ) {

            this._index.get( this.generateIndexKey( record.key, record.newValue ) )
                .then( function( res ) {
                    resolve( res );
                })
                .catch( function( err ) {
                    if ( err.notFound ) {
                        return resolve( null );
                    }

                    reject( err );
                });
        }.bind( this ));
    },


    /**
     * Pass an id (or an array of potential ids)
     *
     * @param id {String || Array} the id to use - will generate a new one if not supplied
     * @returns {Promise}
     */
    _saveModelByID: function( id ) {
        var uuid,
            ops = [];

        // Use id if a string
        if ( _.isString( id ) ) {
            uuid = id;
        }

        // Otherwise its probably an array of results referencing id's
        if ( _.isArray( id ) ) {
            uuid = _.reduce( id, function( acc, val ) {
                return acc || val;
            });
        }

        if ( !uuid ) {
            uuid = this.generateUUID();
        }


        var saveIndices = function() {
            ops.push( this._index.del( this.generateIndexKey( record.key, record.oldValue ), uuid ) );
            ops.push( this._index.put( this.generateIndexKey( record.key, record.newValue ), uuid ) );
        }.bind( this );

        // Save indices
        while ( this._changes.length() ) {
            var record  = this._changes.pop();

            // console.log( 'record:', record );

            if ( record.index ) {
                saveIndices( record, uuid );
            }
        }

        // Now save the actual model
        ops.push( this._db.put( uuid, this.generateSaveItem() ) );


        // Now action all of the operations and return the result
        return new Promise( function( resolve, reject ) {
            Promise.all( ops )
                .then( function( res ) {
                    resolve();
                })
                .catch( function( err) {
                    reject( err );
                });

        }.bind( this ));
    }


});
