/**
 * Defines the change-record class and its controller
 */

var _ = require( 'lodash-node' );


/**
 * Individual Change Record class
 */
var changeRecord = function( record ) {
    _.extend( this, record );
};

/**
 * Change Record protoype,
 * defines a contract for creation, but does not enforce that values are filled.
 */
_.extend( changeRecord.prototype, {
    key: null,
    oldValue: null,
    newValue: null,
    index: null
});



/**
 * Change Records Controller
 */
var changeRecordCtrl = function() {

    this._changes = [];
};

_.extend( changeRecordCtrl.prototype, {
    /**
     * Adds a record to the change array if it needs updating
     *
     * @param record {ChangeRecord} the new change record
     * @returns {Boolean}
     */
    push: function( record ) {
        // Bail if the record exists and is not being changed
        var rec = _.find( this._changes, { key: record.key } );
        if ( rec && rec.newValue === record.newValue ) {
            return false;
        }

        // If it exists then just update it
        if ( rec ) {
            // @todo - is there a quicker way to update an existing record?
            this._changes[ _.findKey( this._changes, { key: record.key } ) ] = record;
            return true;
        }

        // Otherwise add it
        // @todo - potential gotcha as record is a ref, not a problem at present as a new CR
        // is always created but something to look at later.
        this._changes.push( record );
        return true;
    },

    /**
     * Pops the latest change record off the stack
     *
     * @returns {ChangeRecord}
     */
    pop: function() {
        return this._changes.pop();
    },

    /**
     * Returns the length of the list of current changes
     *
     * @returns {Integer}
     */
    length: function() {
        return this._changes.length;
    },

    /**
     * Returns the raw changes array.
     * Use with caution outside of testing.
     *
     * @returns {Array}
     */
    show: function() {
        return this._changes;
    },

    /**
     * Clears the list of changes
     */
    clear: function() {
        while( this._changes.length ) {
            this._changes.pop();
        }
    }
});


exports.changeRecord = changeRecord;
exports.changeRecordCtrl = changeRecordCtrl;
