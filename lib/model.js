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


Model.prototype = {

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

        // should also be a synchronous return
        return Promise.resolve( new ModelInstance( this._db ) );
    }

};


/**
 * Model Instance Constructor
 */
var ModelInstance = function( db ) {
    this._db = db;
}

ModelInstance.prototype = {

    _db: null,

    testMethod: function( str ) {
        console.log( 'from model instance:', str || 'hello' );
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

}
