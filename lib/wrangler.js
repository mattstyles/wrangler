/**
 *   Wrangler
 * © 2014 Matt Styles @personalurban
 */


var Level = require( 'level' ),
    Sublevel = require( 'level-sublevel' ),
    _ = require( 'lodash-node' );


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

    if ( !opts || ( typeof opts === 'object' ? opts && !opts.db : false ) ) {
        throw new Error( 'requires a leveldb instance or a name to create one' );
    }

    // Create or use leveldb instance
    if ( typeof opts === 'string' ) {
        db = Level( opts, {
            valueEncoding: 'json'
        });
    } else if ( opts instanceof Level ) {
        db = opts;
    } else {
        opts.db = typeof opts.db === 'string' ? Level( opts.db, {
            valueEncoding: 'json'
        }) : opts.db;
    }

    // Return new instance and define option defaults
    // var db will either be a leveldb instance or null, whereby the instance will be defined within opts.db
    return new Wrangler( _.extend({
        db: db,
        sep: '\xff',
        model: null
    }, typeof opts === 'object' ? opts : null ));
}


/**
 * Constructor function
 *
 * @param opts {object}
 */
var Wrangler = function( opts ) {
    this.opts = opts;
    this.db = Sublevel( opts.db );
    this.models = [];
};


Wrangler.prototype = {

    addModel: function( model ) {

        this.models.push({
            name: model.id,
            level: this.db.sublevel( model.id )
        });
    }


}
