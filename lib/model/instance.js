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

});
