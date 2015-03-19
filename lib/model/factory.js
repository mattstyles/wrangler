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
     * @param id <String> Factory id
     * @param schema <Object> the factory schema
     * @returns this
     */
    constructor( id, schema ) {
        this.id = id;
        this.schema = schema;

        // cache
        this.models = [];

        return this;
    }

    /**
     * Creates a new model
     * @param props <Object> defines the model
     * @returns <Model>
     */
    create( props ) {
         this._cache( new Model( props ) );
         return this.models[ this.models.length - 1 ];
    }

    /**
     * Caches a model
     * @param model <Model> the model instance
     */
    _cache( model ) {
        //@TODO check unique id - needs `find` method

        this.models.push( model );
    }

}
