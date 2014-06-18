/**
 * model
 *
 * Defines a model that represents a discrete blob of data.
 *
 * The model should expose a few methods for finding and manipulating unique
 * model instances but should also be able to create and return an instance of
 * a specific model to work with.
 */

var util = require( 'util' ),
    EventEmitter = require( 'EventEmitter3' ),
    Promise = require( 'es6-promise' ).Promise,
    _ = require( 'lodash-node' );

/**
 * Model Constructor function
 *
 * @param opts {object}
 *    schema {Schema} the schema for the model
 */
var Model = module.exports = function( opts ) {

    if ( !opts ) {
        throw new Error( 'Models should be defined by a schema' );
    }

    this.opts = opts;
    this.id = opts.id;
    this.schema = opts.schema;
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
     * Checks to see if a db has been registered with this model
     *
     * @return {Boolean}
     */
    ready: function() {
        return !!this._db && !!this.schema;
    },


    /**
     * Creates a unique instance of the model
     */
    create: function() {
        if ( !this.ready() ) {
            console.log( 'Model not ready to be created' );
        }

        var model = new ModelInstance( this.schema );
        model.setDB( this._db );

        // should also be a synchronous return
        // return Promise.resolve( new ModelInstance( this._db ) );
        return Promise.resolve( model );
    }

});


/**
 * Model Instance Constructor
 *
 * @inherits https://github.com/3rd-Eden/EventEmitter3
 * @param schema {Schema} the schema from which to create the model
 */
var ModelInstance = function( schema ) {

    EventEmitter.call( this );

    // Create the change record object for this instance
    this._changes = (function() {

        /**
         * Private changes array
         * @type {Array}
         */
        var changes = [];

        /**
         * Expose public API
         */
        return {
            /**
             * Adds a record to the change array if it needs updating
             *
             * @param record {ChangeRecord} the new change record
             * @returns {Boolean}
             */
            push: function( record ) {
                // Bail if the record exists and is not being changed
                var rec = _.find( changes, { key: record.key } );
                if ( rec && rec.newValue === record.newValue ) {
                    return false;
                }

                // If it exists then just update it
                if ( rec ) {
                    // @todo - is there a quicker way to update an existing record?
                    changes[ _.findKey( changes, { key: record.key } ) ] = record;
                    return true;
                }

                // Otherwise add it
                changes.push( record );
                return true;
            },

            /**
             * Pops the latest change record off the stack
             *
             * @returns {ChangeRecord}
             */
            pop: function() {
                return changes.pop();
            },

            /**
             * Returns the length of the list of current changes
             *
             * @returns {Integer}
             */
            length: function() {
                return changes.length;
            },

            /**
             * Returns the raw changes array.
             * Use with caution outside of testing.
             *
             * @returns {Array}
             */
            show: function() {
                return changes;
            },

            /**
             * Clears the list of changes
             */
            clear: function() {
                while( changes.length ) {
                    changes.pop();
                }
            }
        }
    })();

    // Add each prop from the schema on to the instance
    _.each( schema, function( val, key ) {
        this.addProp( key, val )
    }, this );

}

util.inherits( ModelInstance, EventEmitter );

/**
 * Model Instance Prototype
 */
_.extend( ModelInstance.prototype, {

    /**
     * Pointer to the instance of the db this model is connected to
     */
    _db: null,

    /**
     * The array of changes that should be persisted on save
     */
    _changes: null,

    /**
     * Accessor function to set the db
     * @param db {LevelDB}
     */
    setDB: function( db ) {
        this._db = db;
    },


    // @todo Setting shouldnt happen like this, each model should be updated but require
    // a discrete call to save to put the model to the db.
    /**
     * Sets a value on the model.
     * Only properties defined by the schema can be manipulated.
     *
     * @param key {string}
     * @param value
     * @param opts {Object}
     *   #sync - synchronous put
     *   #silent - dont update the db but update the model
     * @return {Boolean} was the operation successful - @todo currently returns a promise
     */
    set: function( key, value, opts ) {

        // @todo - only writing to db as a test
        return this._db.put( key, value );
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

        this._changes.push({
            key: key,
            oldValue: null,
            newValue: value,
            index: def.index || false
        });

        Object.defineProperty( this, key, {
            get: function() {
                return value;
            },

            set: function( val ) {
                // Set a change record
                this._changes.push({
                    key: key,
                    oldValue: value,
                    newValue: val,
                    index: def.index || false
                });

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
     * Saves the model to the db
     * @todo - currently this is a pretty raw implementation of what it should look like in the db
     */
    save: function() {

        var ops = []

        // Remove each change record to build the batch request object
        while( this._changes.length() ) {
            var record = this._changes.pop();

            ops.push({
                type: 'put',
                key: record.key,
                value: record.newValue
            });
        }

        // Change record array will now be empty so go ahead and batch the changes
        return this._db.batch( ops );

        // @todo this is batching stuff in which means each individual prop goes in,
        // however, the actual implementation should add a json rep of the object saveable props
        // and add indexable props to their separate indexed sublevels.
    }

});
