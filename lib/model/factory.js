import Model from './model';

export default class Factory {
    constructor( id, schema ) {
        this.id = id;
        this.schema = schema;

        return this;
    }


    create( props ) {
        return new Model( props );
    }

}
