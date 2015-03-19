import Model from './model';

export default class Factory {
    constructor( id, schema ) {
        this.id = id;
        this.schema = schema;

        // cache
        this.models = [];

        return this;
    }


    create( props ) {
         this.models.push( new Model( props ) );
         return this.models[ this.models.length - 1 ];
    }

}
