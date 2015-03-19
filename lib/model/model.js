import uuid from 'uuid';

/**
 * Model
 * ---
 * Base model class
 * @class
 */
export default class Model {
    /**
     * @constructs
     * @param props <Object> properties to place on the model instance
     * @returns this
     */
    constructor( props ) {
        if ( !props ) {
            throw new Error( '[Wrangler] model must be instantiated with a prototype' );
        }

        Object.keys( props ).forEach( key => {
            if ( !this[ key ] ) {
                this[ key ] = props[ key ];
                return;
            }

            throw new Error( '[Wrangler] model contains keys on the Model class ::: ' + key );
        });

        this.id = uuid.v4();

        return this;
    }
}
