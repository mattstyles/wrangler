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
     * @returns <Model>
     */
    create( props ) {
        var model = new Model( props, {
            factory: this
        });
        this._pushToCache( model );
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

        var tmp = this.create( model );
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
     * @TODO search by keys e.g. { name: 'Dave' }
     * @TODO search local cache first
     * @param id <String> the id to search for
     * @returns <Promise> resolves with the found <Model> or throws
     */
    find( id ) {
        if ( !id ) {
            throw new Error( '[Wrangler] finding a model requires a search space' );
        }

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
     * Find everything
     * @TODO search local cache first
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
        //@TODO check unique id - needs `find` method

        this.cache.push( model );
    }
}
