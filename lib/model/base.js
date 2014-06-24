/**
 * Base Model Class
 *
 * This class is inherited by both the Model Controller class and each Model instance.
 */


var util = require( 'util' ),
    EventEmitter = require( 'EventEmitter3' ),
    Promise = require( 'es6-promise' ).Promise,
    _ = require( 'lodash-node' ),
    uuid = require( 'node-uuid' );



/**
 * Model Base Constructor
 *
 * @inherits https://github.com/3rd-Eden/EventEmitter3
 */
var ModelBase = module.exports = function() {

    EventEmitter.call( this );
}

util.inherits( ModelBase, EventEmitter );

_.extend( ModelBase.prototype, {

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
     * Returns the existing unique identifier or creates a new one
     *
     * @param opts {object}
     *   unique {Boolean} will always return a new uuid and not set it on this object
     * @return {String/RFC4122 UUID}
     */
    generateUUID: function( opts ) {
        if ( opts && opts.unique ) {
            return uuid.v1();
        }

        this._uuid = this._uuid || uuid.v1();
        return this._uuid;
    }


});
