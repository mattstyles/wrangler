

export default class Model {
    constructor( props ) {
        if ( !props ) {
            throw new Error( '[Wrangler] model must be instantiated with a prototype' );
        }

        // @TODO pick from factory schema
        Object.keys( props ).forEach( function( key ) {
            if ( !this[ key ] ) {
                this[ key ] = props[ key ];
                return;
            }

            throw new Error( '[Wrangler] model contains keys on the Model class ::: ' + key );
        }, this );

        return this;
    }
}
