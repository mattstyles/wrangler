
import Factory from './model/factory';

/**
 * Wrangler
 *
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
     * @param schema <Object> defines the models managed by the factory
     */
    Factory( id, schema) {
        return new Factory( id, schema );
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
