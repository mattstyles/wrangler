import core from 'core-js/library';

import Model from './model';

/**
 * Factory
 * ---
 * Responsible for creating new model instances
 * Manages the collection of models
 * @class
 */
export default class Factory {
    /**
     * @constructs
     * @param opts <Object>
     *   @id <String> unique id for factory instance
     *   @schema <Object> model schema
     *   @db <LevelDB> level instance
     * @returns this
     */
    constructor( opts ) {
        this.id = opts.id;
        this.schema = opts.schema;
        this.db = opts.db;

        // cache
        this.cache = [];

        return this;
    }

    /**
     * Creates a new model
     * @param props <Object> defines the model
     * @param opts <Object> _optional_
     *   ::cache <Boolean> should creation be cached
     * @returns <Model>
     */
    create( props, opts ) {
        var options = core.Object.assign({
            cache: true
        }, opts );

        var model = new Model( props, {
            factory: this
        });

        if ( options.cache ) {
            this._pushToCache( model );
        }
        return model;
    }


    /**
     * Fake serialize a model
     * Ignores private props (prefixed with _) and functions
     * @param model <Model>
     * @return <Object> json-safe object
     */
    serialize( model ) {
        var tmp = {};
        Object.keys( model ).forEach( key => {
            // Bail on private (prefixed with _) or function
            if ( /^_/.test( key ) || typeof model[ key ] === 'function' ) {
                return;
            }

            tmp[ key ] = model[ key ];
        });

        return tmp;
    }

    /**
     * Takes a stored model and creates a new model with the same id
     * @param model <Object> serialized model
     * @return <Model>
     */
    deserialize( model ) {
        if ( !model.id ) {
            throw new Error( '[Wrangler] deserialize expects a valid model with an id' );
        }

        var tmp = this.create( model, {
            cache: false
        });
        tmp.id = model.id;
        return tmp;
    }

    /**
     * Saves a model
     * @param model <Model> the model to save
     * @returns <Promise> resolves with the model instance or throws
     */
    save( model ) {
        if ( !model.id ) {
            throw new Error( '[Wrangler] model to save must have an id' );
        }

        var obj = this.serialize( model );

        return new Promise( ( resolve, reject ) => {
            this.db.put( obj.id, obj, ( err ) => {
                if ( err ) {
                    return reject( err );
                }

                resolve( model );
            });
        });
    }

    /**
     * Removes a model
     * @param model <Model> the model to remove
     * @returns <Promise> resolves when complete or throws
     */
    remove( model ) {
        if ( !model.id ) {
            throw new Error( '[Wrangler] model to remove must have an id' );
        }

        return new Promise( ( resolve, reject ) => {
            this.db.del( model.id, err => {
                if ( err ) {
                    return reject( err );
                }

                resolve();
            });
        });
    }

    /**
     * Finds a model by id
     * Uses cache if available
     * @TODO search by keys e.g. { name: 'Dave' }
     * @TODO how to test cached return?
     * @param id <String> the id to search for
     * @param opts <Object> _optional_
     *   ::cache <Boolean> should try to retrieve from cache
     * @returns <Promise> resolves with the found <Model> or throws
     */
    find( id, opts ) {
        if ( !id ) {
            throw new Error( '[Wrangler] finding a model requires a search space' );
        }

        var options = core.Object.assign({
            cache: true
        }, opts );

        // Try and get as quick as possible
        if ( options.cache ) {
            var local = core.Array.find( this.cache, res => {
                return res.id === id;
            });

            // Resolved locally so return immediately and refresh cache
            if ( local ) {
                this.db.get( local.id, ( err, res ) => {
                    if ( err ) {
                        throw new Error( err );
                    }

                    this._removeFromCache( local );
                    this.cache.push( this.deserialize( res ) );
                });

                return Promise.resolve( local );
            }
        }


        // Otherwise go the long way
        return new Promise( ( resolve, reject ) => {
            this.db.get( id, ( err, res ) => {
                if ( err ) {
                    return reject( err );
                }

                resolve( this.deserialize( res ) );
            });
        });
    }

    /**
     * Find everything in db
     * @returns <Promise> resolves with an <Array:Model> of models
     */
    findAll() {
        var models = [];
        return new Promise( ( resolve, reject ) => {
            this.db.createReadStream()
                .on( 'data', res => {
                    // @TODO eventually search keys will also be included,
                    // @TODO this should only return models i.e. search by id
                    models.push( this.deserialize( res.value ) );
                })
                .on( 'error', err => {
                    reject( err );
                })
                .on( 'close', () => {
                    resolve( models );
                })
                .on( 'end', () => {
                    resolve( models );
                });
        });
    }


    /**
     * Caches a model
     * @private
     * @param model <Model> the model instance
     */
    _pushToCache( model ) {
        // @TODO should check id to stop duplicates from refreshes and stuff

        this.cache.push( model );
    }

    /**
     * Removes a model from the cache
     * @private
     * @param model <Model> the model to remove from cache
     */
    _removeFromCache( model ) {
        var index = this._findCacheIndex( model );

        if ( !index && index !== 0 ) {
            throw new Error( '[Wrangler] can not remove model from cache' );
        }

        this.cache.splice( index, 1 );
    }

    /**
     * Finds the index in the cache of the model
     * @private
     * @param model <Model> the model to search for
     */
    _findCacheIndex( model ) {
        var index = null;
        core.Array.find( this.cache, ( res, i ) => {
            if ( res.id === model.id ) {
                index = i;
            }
            return res.id === model.id;
        });
        return index;
    }
}
