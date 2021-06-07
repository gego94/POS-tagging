

function isNumber(num) {
	if(num === '.' || num === ',')
		return false;
	if (num.length === 0) { return true; }
	const nums = ['uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci',
		'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove', 'venti',
		'ventuno', 'ventotto', 'trenta',
		'trentuno', 'trentotto', 'quaranta',
		'quarantuno', 'quarantotto', 'cinquanta',
		'cinquantuno', 'cinquantotto', 'sessanta',
		'sessantuno', 'sessantotto', 'settanta',
		'settantuno', 'settantotto', 'ottanta',
		'ottantuno', 'ottantotto', 'novanta',
		'novantuno', 'novantotto', 'cento',
		'mille', 'milione', 'milioni', 'mila', 'miliardo', 'miliardi'];

	let b = true;
	for (let i = 0; i < num.length; i++) {
		const y = num.charCodeAt(i);
		if (!((y < 58 && y > 47) || y === 46 || y === 44)) {
			b = false;
			break;
		}
	}

	if (b) { return true; }

	for (const el of nums) {
		if (num.startsWith(el)) {
			return isNumber(num.substring(el.length, num.length));
		}
	}
	return false;
}

/*** true se una stringa è vuota o composta solo da spazi / tabulazioni ***/
function isNullOrEmpty(str){
	return !str||!str.trim();
}


function stringheUguali(s1,s2) {
	if(s1.length !== s2.length) return false;
	for(let i = 0 ; i < s1.length;i++)
		if(s1[i] !== s2[i]) return false;
	return true;
}

function getMaxOfArray(numArray) {
	return Math.max.apply(null, numArray);
}

function arrEquals(arr1,arr2){
	if(arr1 !== undefined && arr2!== undefined)
		for(let i = 0; i < arr1.length ; i++) {
			if(arr1[i] !== arr2[i])
				return false;
		}
	return true;
}



function copiaArray(arr) {
	let ris = [];
	for(let el of arr)
		ris.push(el);
	return ris;
}


function rimuoviSpazi(parola) {
	return parola.replace(/ /g, '').trim();
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/** 
	Valuta se le 2 regole passate sono uguali
	{ need: [ '6' ], prec: '3', target: '8', corr: 87, tipo: 2 },
  	{ need: [ '7' ], prec: '3', target: '8', corr: 85, tipo: 2 },
	@return{Boolean}
*/
function regoleUguali(r1, r2) {
	if(r1.need.length !== r2.need.length)
		return false;
	for(let i = 0 ; i < r1.need.length ; i++) {
		if(r1[i] !== r2[i])
			return false
	}
	return r1.prec === r2.prec && r1.target === r2.target && r1.tipo === r2.tipo;
}

module.exports = {
	isNumber: isNumber,
	isNullOrEmpty: isNullOrEmpty,
	arrEquals:arrEquals,
	getMaxOfArray: getMaxOfArray,
	copiaArray:copiaArray,
	regoleUguali:regoleUguali,
	stringheUguali:stringheUguali,
	rimuoviSpazi:rimuoviSpazi,
	sleep:sleep
};


