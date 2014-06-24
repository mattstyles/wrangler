/**
 * model
 *
 * Defines a model that represents a discrete blob of data.
 *
 * The model should expose a few methods for finding and manipulating unique
 * model instances but should also be able to create and return an instance of
 * a specific model to work with.
 *
 * @todo - there are currently separate instances of generateIndexKey, these
 * generator functions should be extracted to a ModelBase which both Model and
 * Instance inherit from.
 */

var util = require( 'util' ),
    EventEmitter = require( 'EventEmitter3' ),
    Promise = require( 'es6-promise' ).Promise,
    _ = require( 'lodash-node' ),
    uuid = require( 'node-uuid' ),

    ChangeRecord = require( './model/change-record' ).ChangeRecord,
    ChangeRecordCtrl = require( './model/change-record' ).ChangeRecordCtrl;

/**
 * Model Constructor function
 *
 * @param opts {object}
 *    id {String}
 *    schema {Schema} the schema for the model
 */
var Model = module.exports = function( opts ) {

    if ( !opts ) {
        throw new Error( 'Models should be defined by a schema' );
    }

    this.opts = opts;
    this.id = opts.id;
    this._schema = opts.schema;
};


_.extend( Model.prototype, {

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
     * Accessor function to set the db
     * @param db {LevelDB}
     */
    setDB: function( db ) {
        this._db = db;

        // Set up index level
        this._index = this._db.sublevel( 'INDEX', {
            sync: true
        });
    },


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
            sep: this._sep
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
     */
    find: function( term ) {

        return new Promise( function( resolve, reject ) {

            var keys = _.keys( term );

            if ( !term ) {
                reject( new Error( 'Model.find requires a search term' ) );
            }

            if ( keys.length > 1 ) {
                reject( new Error( 'Model.find currently accepts just one search key' ) );
            }

            var self = this;

            this._index.get( this.generateIndexKey( keys[ 0 ], term[ keys[ 0 ] ] ) )
                .then( function( value ) {

                    // @todo - this is currently returning the raw json - it should return a model instance
                    resolve( self._db.get( value ) );
                })
                .catch( function( err ) {
                    reject( 'Error finding item: ' + err );
                });

        }.bind( this ));
    },


    /**
     * Adds separators and builds index keys.
     *
     * @param key {String} property key
     * @param value {String} property value
     * @return {String} the key to use as an index
     */
    generateIndexKey: function( key, value ) {
        return key + this._sep + value;
    }

});




/**
 * Model Instance Constructor
 *
 * @inherits https://github.com/3rd-Eden/EventEmitter3
 * @param schema {Schema} the schema from which to create the model
 */
var ModelInstance = function( opts ) {

    EventEmitter.call( this );

    this._schema = opts.schema;
    this._sep = opts.sep;
    this.setDB( opts.db );

    // Create the change record object for this instance
    this._changes = new ChangeRecordCtrl();

    // Add each prop from the schema on to the instance
    _.each( opts.schema, function( val, key ) {
        this.addProp( key, val )
    }, this );

}

util.inherits( ModelInstance, EventEmitter );

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
     * Accessor function to set the db
     * @param db {LevelDB}
     */
    setDB: function( db ) {
        this._db = db;

        // Set up indices
        this._index = this._db.sublevel( 'INDEX', {
            sync: true
        });
    },


    /**
     * Adds a property to the model
     *
     * @param key {string} object key to set
     * @param def {Object} property definition - should be a schema prop def
     */
    addProp: function( key, def ) {
        var value = def.default || null;

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
                this.emit( 'change:' + key, value );
                var ret = {};
                ret[ key ] = value;
                this.emit( 'change', ret );
            }
        });
    },

    /**
     * Saves the model to the db.
     * Searches the change records and updates index links to the actual model object,
     * then saves the model based upon its schema.
     *
     * @returns {Promise}
     */
    save: function() {

        var ops = [];    // List of promises waiting to be fulfilled

        // Remove each change record to build the batch request object
        while( this._changes.length() ) {
            var record = this._changes.pop();

            // Insert indexable records
            if ( record.index ) {
                // Remove old record first
                ops.push( this._index.del( this.generateIndexKey( record.key, record.oldValue ), this.generateUUID() ) );
                ops.push( this._index.put( this.generateIndexKey( record.key, record.newValue ), this.generateUUID() ) );
            }
        }

        // Now put the saveable props as a json block
        ops.push( this._db.put( this.generateUUID(), this.generateSaveItem() ) );

        return Promise.all( ops );
    },


    /*-----------------------------------------------------------*\
     *
     *  Helpers
     *
    \*-----------------------------------------------------------*/


    /**
     * Adds separators and builds index keys.
     *
     * @param key {String} property key
     * @param value {String} property value
     * @return {String} the key to use as an index
     */
    generateIndexKey: function( key, value ) {
        return key + this._sep + value;
    },


    /**
     * Creates a saveable representation of the object, based upon the schema.
     *
     * @return {Object}
     */
    generateSaveItem: function() {
        var saveItem = {};

        _.each( this._schema, function( value, key ) {
            // Dont save silent schema props
            if ( value.silent ) {
                return;
            }

            saveItem[ key ] = this[ key ];
        }, this );

        return saveItem;
    },

    /**
     * Returns the existing unique identifier or creates a new one
     *
     * @return {String/RFC4122 UUID}
     */
    generateUUID: function() {
        this._uuid = this._uuid || uuid.v1();
        return this._uuid;
    }

});
