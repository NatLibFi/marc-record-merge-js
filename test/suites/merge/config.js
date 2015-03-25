
module.exports = {

	fields: {
		'500': { 'action': 'copy' },
		'490': { 
			'action': 'moveSubfields',
			'options': { 
			 	'subfields': ['9'] 
			 } 
		},
		'700': {
			'action': 'copy',
			"options": { "compareWithout": ["9","4","e"] },
		}
	}
	
};
