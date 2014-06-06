/**
 * schema
 *
 * Defines a schema for a model
 *
 * Adding properties to a schema
 * Schema.add({
 *   foo: 'foo'
 * });
 * Adding pre-existing errors will throw, this behaviour can be over-written using force
 * Schema.add({
 *   foo: {
 *     force: true,
 *     value: 'foobar'
 *   }
 * });
 * In this case the force parameter will be stripped and as value is the only property it will be used as the value of foo
 */

var _ = require( 'lodash-node' );


/**
 * Constructor function
 *
 * @param def {object} schema definition
 */
var Schema = module.exports = function( def ) {

    this.add( def );
};


/**
 * Schema prototype
 */
Schema.prototype = {

    /**
     * Adds a property (or properties) to the schema definition
     *
     * @param prop {object} property/ies definition
     */
    add: function( prop ) {
        if ( !_.isObject( prop ) ) {
            throw new Error( 'new property must be defined as an object' );
        }

        _.each( prop, function( val, key ) {
            if ( this[ key ] && !val.force ) {
                throw new Error( 'adding key: "' + key + '" -- schema property already defined' );
            }

            if ( val.force ) {
                delete val.force;
            }

            if ( _.keys( val ).length === 1 && val.value ) {
                val = val.value;
            }

            this[ key ] = val;
        }, this );
    },


    /**
     * Removes a property (or properties) from the schema definition
     *
     * @param prop {array|string} property/ies to remove
     */
     remove: function( prop ) {
         if ( _.isString( prop ) ) {
             prop = [ prop ];
         }

         _.each( prop, function( key ) {
             if ( Schema.prototype[ key ] ) {
                 throw new Error( 'removing key: "' + key + '" -- can not remove prototype property' );
             }

             if ( !this[ key ] ) {
                 throw new Error( 'removing key: "' + key + '" -- key does not exist on the object' );
             }

             delete this[ key ];
         }, this );
     }
};
