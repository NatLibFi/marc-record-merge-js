
module.exports = {

	fields: {
		'500': { 'action': 'copy' },
		'490': { 
			'action': 'moveSubfields',
			'options': { 
			 	'subfields': ['9'] 
			 } 
		},
		"6..": { "action": "copy", "options": { "compareWithout": ["9"], "mustBeIdentical": false } },
		"600": { "action": "copy", "options": { "compareWithout": ["9","e","4"] } },
		"610": { "action": "copy", "options": { "compareWithout": ["9","e","4"] } },
		"611": { "action": "copy", "options": { "compareWithout": ["9","e","4"] } },

		'700': {
			'action': 'copy',
			"options": { "compareWithout": ["9","4","e"] },
		}
	}
	
};
