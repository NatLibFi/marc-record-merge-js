
module.exports = {

	fields: {
		"022": { "action": "copy", "options": { "compareWithoutIndicators": true } },
		'300': { 'action': 'copy' },
		'500': { 'action': 'copy' },
		'490': { 
			'action': 'moveSubfields',
			'options': { 
			 	'subfields': ['9'] 
			 } 
		},
		"6..": { "action": "copy", "options": { "compareWithout": ["9"], "mustBeIdentical": true } },
		"600": { "action": "copy", "options": { "compareWithout": ["9","e","4"] } },
		"610": { "action": "copy", "options": { "compareWithout": ["9","e","4"] } },
		"611": { "action": "copy", "options": { "compareWithout": ["9","e","4"] } },

		'700': {
			'action': 'copy',
			"options": { "compareWithout": ["9","4","e"] },
		}
	}
	
};
