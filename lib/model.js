/**
 * model
 *
 * Defines a model that represents a discrete blob of data
 */

var _ = require( 'lodash-node' );

/**
 * Constructor function
 *
 * @param opts {object}
 *    schema {Schema} the schema for the model
 */
var Model = module.exports = function( opts ) {

    if ( !opts ) {
        throw new Error( 'Models should be defined by a schema' );
    }

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
     * Sets a value on the model.
     * Only properties defined by the schema can be manipulated.
     *
     * @param key {string}
     * @param value
     * @return {Boolean} was the operation successful
     */
    set: function( key, value ) {

    }

};
