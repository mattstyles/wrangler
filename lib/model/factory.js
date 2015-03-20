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
     * Caches a model
     * @private
     * @param model <Model> the model instance
     */
    _pushToCache( model ) {
        //@TODO check unique id - needs `find` method

        this.cache.push( model );
    }
}
