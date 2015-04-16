"use strict";

var Q = require('q');

function chooseField100FromOther(merged, fieldInOther, fieldConfig) {
	var defer = Q.defer();

	setTimeout(function() {

		merged.fields = merged.fields.filter(function(f) {
			return (f.tag !== '100');
		});

		fieldInOther.wasUsed = true;
		fieldInOther.fromOther = true;
		merged.fields.push(fieldInOther);

		defer.resolve();
	}, 50);

	return defer.promise;
}

module.exports = {

	fields: {
		'100': { 'action': chooseField100FromOther },
	}
};
