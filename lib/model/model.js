import EventEmitter from 'eventemitter3';
import uuid from 'uuid';

/**
 * Model
 * ---
 * Base model class
 * @class
 */
export default class Model extends EventEmitter {
    /**
     * @constructs
     * @param props <Object> properties to place on the model instance
     * @param opts <Object>
     * @returns this
     */
    constructor( props, opts ) {
        if ( !props ) {
            throw new Error( '[Wrangler] model must be instantiated with a prototype' );
        }

        var tmp = {};

        // Blanket the props to the new model, the schema kicks in on save
        Object.keys( props ).forEach( key => {
            if ( !this[ key ] ) {
                tmp[ key ] = props[ key ];
                this[ key ] = tmp[ key ];
                return;
            }

            throw new Error( '[Wrangler] model contains keys on the Model class ::: ' + key );
        });

        this.id = uuid.v4();
        this._factory = opts.factory;
        return this;
    }


    /**
     * Saves a model instance to the db
     * @returns <Promise> resolves with the model instance or throws
     */
    save() {
        this.emit( 'save', this );
        return this._factory.save( this );
    }

}
