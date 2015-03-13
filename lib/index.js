
import Model from './model/model';

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
     * Construct new model
     * @param id <String> unique id of model
     * @param schema <Object> defines the model
     */
    Model( id, schema) {
        return new Model( id, schema );
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
