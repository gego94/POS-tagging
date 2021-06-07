const utils = require('./utils.js');
const fs = require('fs');

let tags = {
		'_ADJ'	:0	,
		'_NOUN'	:1	,
		'_ADP'	:2	,
		'_DET'	:3	,
		'_PROPN':4	,
		'_PUNCT':5	,
		'_AUX'	:6	,
		'_VERB'	:7	,
		'_PRON'	:8	,
		'_CCONJ':9	,
		'_NUM'	:10	,
		'_ADV'	:11	,
		'_INTJ'	:12	,
		'_SCONJ':13	,
		'_X'	:14	,
		'_SYM'	:15	,
		'_PART'	:16
	};

let tagInversi = {
		0:'_ADJ'	,
		1: '_NOUN'	,
		2: '_ADP'	,
		3: '_DET'	,
		4: '_PROPN',
		5: '_PUNCT',
		6: '_AUX'	,
		7: '_VERB'	,
		8: '_PRON'	,
		9: '_CCONJ',
		10:'_NUM'	,
		11:'_ADV'	,
		12:'_INTJ'	,
		13:'_SCONJ',
		14:'_X'	,
		15:'_SYM'	,
		16:'_PART'	
	};

/**
	usa il morph per taggare la frase passata come parametro
	@param{String} frase separata da spazi
	@return{Array} l'array con i tag delle parole
 */
function taggaFrase(frase) {	

	frase = frase.split(" ");

	let tgs = [];
	for(let parola = 0 ; parola < frase.length ; parola++) {
		let p = utils.rimuoviSpazi(frase[parola]);
		tgs.push([]);
		// metto tag nome proprio se inizia con la maiuscola
		if(parola !== 0 && p[0] !== undefined && /^[A-Z]/.test(p)) {
			tgs[parola].push("_PROPN");
		}
		p = p.toLowerCase();
		let t = morph[p];
		if(tgs[parola].length === 0) {
			if(utils.isNumber(p)) {
				//	numero se è un numero
				tgs[parola].push("_NUM");
			} else if(t !== undefined) {
				// il tag suo se è presente nel dizionario
				tgs[parola].push("_" + t[0]);
			} else {
				// nome in tutti gli altri casi
				tgs[parola].push("_NOUN");
			}
		}
	}
	return tgs;
}

/**
	Carica i dati per poter usare il tagger
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per caricare i file (lo stesso nome usato per inizializzare le regole)
	nella cartella deve essere presente il file 'regoleBrills'+nome+'.json', fatto di un [] se vuoto o dalle regole 
	precedentemente estratte
 */
function caricaDati(cartella, nome) {
	morph = require('./morphSingoliTag.json');
	valide = require('./'+cartella+'/regoleBrills'+nome+'.json');
	valideScon = require('./'+cartella+'/regoleBrillsScon'+nome+'.json');
}

/**
	Testa tutte le regole per vedere se vanno bene e in caso cambia il tag
	@param{Array} tgs: array con i tag singoli
	@param{Int} pos: la posizione da controllare
	@param{String} frase: la frase staggata
	@return{Array} tgs: l'array con i tag aggiornati in caso di bisogno
 */
function provaRegole(tgs, frase) {
	frase = frase.split(" ");
	for(let regola of valide) {
		for(let pos = 0 ; pos < tgs.length ; pos++) {
			// il tag prima è x
			if(tgs[pos][0] === regola.prec) {
				if(( regola.tipo === 1 && pos - 1 >= 0 && tgs[pos-1][0] === regola.need[0]) || //il tag prima è quello giusto
					(regola.tipo === 2 && pos + 1 < tgs.length && tgs[pos+1][0] === regola.need[0]) || //il tag dopo è quello giusto
					(regola.tipo === 3 && pos - 2 >= 0 && tgs[pos-2][0] === regola.need[0]) || //il tag 2 prima è quello giusto
					(regola.tipo === 4 && pos + 2 < tgs.length && tgs[pos+2][0] === regola.need[0]) || //il tag 2 dopo è quello giusto
					(regola.tipo === 5 && pos - 1 >= 0 && pos + 1 < tgs.length 
						&& tgs[pos-1][0] === regola.need[0] && tgs[pos+1][0] === regola.need[1]) || // tag prima e dopo giusti
					(regola.tipo === 6 && pos - 2 >= 0 && tgs[pos-1][0] === regola.need[0] //il tag prima e 2 prima sono giusti
						&& tgs[pos-2][0] === regola.need[1]) ||
					(regola.tipo === 7 && pos + 2 < tgs.length && tgs[pos+1][0] === regola.need[0] 	// tag dopo e 2 dopo giusti
						&& tgs[pos+2][0] === regola.need[1] ) || 	
					(regola.tipo === 8 && pos + 2 < tgs.length 	&& (tgs[pos+1][0] === regola.need[0] 
					|| tgs[pos+2][0] === regola.need[0])) || // regola 8, uno dei 2 dopo 
					(regola.tipo === 9 && pos - 2 >= 0 && (tgs[pos-1][0] === regola.need[0] 
						|| tgs[pos-2][0] === regola.need[0])) || // regola 9, tag x in uno dei 2 prima 
					(regola.tipo === 10 && pos + 3 < tgs.length && (tgs[pos+1][0] === regola.need[0] 
						|| tgs[pos+2][0] === regola.need[0] || tgs[pos+3][0] === regola.need[0]) ) || // regola 10, tag x in uno dei 3 dopo
					(regola.tipo === 11 && pos - 3 >= 0 && (tgs[pos-1][0] === regola.need[0] || tgs[pos-2][0] === regola.need[0] 
						|| tgs[pos-3][0] === regola.need[0])) || // regola 11, tag x in uno dei 3 prima
					(regola.tipo === 12 && pos - 1 >= 0 && frase[pos-1].toLowerCase() === regola.need[0].toLowerCase()) || // regola 12, la parola prima è x
					(regola.tipo === 13 && 	pos + 1 < frase.length && frase[pos+1].toLowerCase() === regola.need[0].toLowerCase() ) || // regola 13, la parola dopo è x
					(regola.tipo === 14 && pos - 2 >= 0 && frase[pos-2].toLowerCase() === regola.need[0].toLowerCase()) || // regola 14, la parola 2 prima è x 
					(regola.tipo === 15 && pos + 2 < frase.length && frase[pos+2].toLowerCase() === regola.need[0].toLowerCase()) || // regola 15, la parola 2 dopo è x
					(regola.tipo === 16 && pos - 2 >= 0 && (frase[pos-1].toLowerCase() === regola.need[0].toLowerCase() 
						|| frase[pos-2].toLowerCase() === regola.need[0].toLowerCase() )) || // regola 16, una delle 2 parola prima è x
					(regola.tipo === 17 && pos + 2 < frase.length && (frase[pos+1].toLowerCase() === regola.need[0].toLowerCase() 
						|| frase[pos+2].toLowerCase() === regola.need[0].toLowerCase() ))) // regola 17, una delle 2 parola dopo è x
					{ 
						// se l'attuale è da cambiare lo cambio
						tgs[pos][0] = regola.target;
					}
				}
			}
		}
	return tgs;
}

/**
	Testa tutte le regole per vedere se vanno bene e in caso cambia il tag
	@param{Array} tgs: array con i tag singoli
	@param{Int} pos: la posizione da controllare
	@param{String} frase: la frase staggata
	@return{Array} tgs: l'array con i tag aggiornati in caso di bisogno
 */
function provaRegoleSconosciute(tgs, frase, daControllare) {
	frase = frase.split(" ");
	for(let regola of valideScon) {
		for(let pos of daControllare) {
			if(tgs[pos][0] === regola.prec ) {
				if(((regola.tipo === 1 || regola.tipo === 2 || regola.tipo === 3) && 
						frase[pos].toLowerCase().endsWith(regola.need[0].toLowerCase())  
					) || (
						regola.tipo === 4 && pos - 1 >= 0 && frase[pos-1].toLowerCase() === regola.need[0].toLowerCase()
					) || (
						regola.tipo === 5 && pos + 1 < frase.length && frase[pos+1].toLowerCase() === regola.need[0].toLowerCase()
					)
					) {
						// se la regola è rispettata aggiorno il tag
						tgs[pos][0] = regola.target;
				}
			}
		}
	}
	return tgs;
}

/**
	Applica tutte le regole alla frase
	@param{String} frase: la frase da taggare
	@return{Array} i tag per la frase dopo aver applicato tutte le regole necessarie
 */
function applicaRegole(frase) {
	// tag iniziale della frase
	// morph = require('./morphSingoliTag.json');
	let fraseTaggata = taggaFrase(frase);
	frase = frase.split(" ");
	let daControllareSconosciute = [];
	for(let el = 0 ; el < frase.length ; el++) {
		if(morph[frase[el].trim().toLowerCase()] === undefined)
			daControllareSconosciute.push(el);
	}
	frase = frase.join(" ");
	// traduco i tag in numero
	for(let el of fraseTaggata) {
		for(let p = 0 ; p < el.length ; p++) {
			if(tags[el[p]] !== undefined)
				el[p] = tags[el[p]].toString();
		}
	}
	// applico le regole dove c'erano sconosciute
	fraseTaggata = provaRegoleSconosciute(fraseTaggata, frase, daControllareSconosciute);

	// applico le regole 
	fraseTaggata = provaRegole(fraseTaggata, frase);
	
	// ritraduco i tag in stringhe
	for(let el in fraseTaggata) 
		fraseTaggata[el] = tagInversi[fraseTaggata[el]];

	return fraseTaggata;
}

var myArgs = process.argv.slice(2);

caricaDati(myArgs[0], myArgs[1]);
console.log(valide.length)
console.log(valideScon.length)

if(myArgs[2].endsWith(".txt")) {
	var file = fs.readFileSync(myArgs[2], 'utf-8').split("\n");
	var totali = 0;
	var corretti = 0;
	for(frase of file) {
		var fraseSplittata = frase.split(" ");
		var toTag = [];
		var tagCorretti = [];
		for(parola of fraseSplittata) {
			var s = parola.split("_");
			if(s.length>1){
				totali++;
				toTag.push(s[0]);
				tagCorretti.push("_" + s[1].trim());
			}
		}
		var fraseTaggata = applicaRegole(toTag.join(" "));
		for(i=0; i< tagCorretti.length; i++){
			if(tagCorretti[i]==fraseTaggata[i])
				corretti++;
		}
	}
	console.log("Corretti : " + corretti + "/" + totali + "   -->   " + (corretti/totali)*100 + " %")
}
else {
	for(frase = 2 ; frase < myArgs.length ; frase++){
		console.log(myArgs[frase]);
		console.log(applicaRegole(myArgs[frase]));
	}
}