
import Factory from './model/factory';

/**
 * Wrangler
 * ---
 * @class
 */
class Wrangler {

    /**
     * @constructs
     * @param db <Level> leveldb instance
     * @param opts <Object> _optional_
     */
    constructor( db, opts ) {
        if ( !db ) {
            throw new Error( '[Wrangler] must pass in a db instance' );
        }

        this.db = db;

        return this;
    }

    /**
     * Construct new model factory
     * @param id <String> unique id of factory
     * @param schema <Object> _optional_ defines the models managed by the factory
     * @returns Factory
     */
    createFactory( id, schema ) {
        if ( !id ) {
            throw new Error( '[Wrangler] factories must have an id' );
        }
        
        return new Factory({
            id: id,
            schema: schema,
            db: this.db
        });
    }

    /**
     * Closes db connection
     */
    close() {
        this.db.close();
    }
}


// optional new
export default ( db, opts ) => {
    return new Wrangler( db, opts );
};
