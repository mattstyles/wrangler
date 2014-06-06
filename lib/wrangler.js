/**
 *   Wrangler
 * © 2014 Matt Styles @personalurban
 */


var Level = require( 'level' ),
    Sublevel = require( 'level-sublevel' ),
    _ = require( 'lodash-node' ),
    Promise = require( 'es6-promise' ).Promise;


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
        sep: '\xff'
    }, typeof opts === 'object' ? opts : null ));
};


/**
 * Constructor function
 *
 * @param opts {object}
 */
var Wrangler = function( opts ) {

    return new Promise( function( resolve, reject ) {
        this.opts = opts;
        this.db = Sublevel( opts.db );
        this.meta = this.db.sublevel( 'meta' );

        // Store any models
        this.models = [];
        var self = this;

        Promise.all( _.map( opts.models, function( model ) {
            return self.addModel( model );
        }))
            .then( function( results ) {
                resolve( self );
            })
            .catch( function( err ) {
                reject( err );
            });

    }.bind( this ));
};


Wrangler.prototype = {

    /**
     * Adds a model definition to the db
     */
    addModel: function( model ) {

        if ( _.find( this.models, model ) ) {
            throw new Error( 'Model has already been added to wrangler' );
        }

        return new Promise( function( resolve, reject ) {

            this.meta.get( 'models', function( err, val ) {
                if ( ( err && !err.notFound ) && !_.find( val, model.id ) ) {
                    val.push( model.id );
                }

                model._db = this.db.sublevel( model.id );

                this.models.push( model );
                this.meta.put( 'models', _.pluck( this.models, 'id' ), function( err ) {
                    if ( err ) {
                        reject( err );
                    }

                    resolve( model );
                });

            }.bind( this ));
        }.bind( this ));
    }


}
