const _ = require('lodash');
const fs = require('fs');
const utils = require('./utils');
let tot = [];
let valide, 	// array con le regole valide
	valideScon, // array con le regole valide per le parole sconosciute 
	ritag, 		// array di array con i tag parziali
	corretti,	// array di array con i tag corretti per posizione
	staggate, 	// array di array con le parole senza tag
	regole , 	// array per le regole generate da dove prendere quelle valide in base al numero di correzioni corrette
	regoleScon, // array per le regole sconosciute generate da dove prendere quelle valide in base al numero di correzioni corrette
	sconosciute, // array di array con indice 1 se in quella posizione la parola non è nel dizioanrio
	morph,			// dizionario
	// serve solo temporaneamente quando vengono generate le regole per migliorare i tempi di esecuzione
	regoleTemp = {1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[],10:[],11:[],12:[],13:[],14:[],15:[],16:[],17:[]} ;	
	
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
			//	numero se è un numero
			if(utils.isNumber(p)) {
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
	Chiama le funzioni per inizializzare i dati per addestrare brill
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file
	@param{String} nomeTrain: nome del file di train senza estensione --> accetta solo file in txt
 */
function inizializzaPerRegole(cartella, nome, nomeTrain) {
	fs.writeFileSync('./'+cartella+'/regoleBrills'+nome+'.json', "[]", 'utf-8');
	fs.writeFileSync('./'+cartella+'/regoleDaValutare'+nome+'.json', "[]", 'utf-8');
}

/**
	Carica i dati per poter usare il tagger
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per caricare i file (lo stesso nome usato per inizializzare le regole)
	@param{String} diz: percorso relativo del dizionario completo es : './morph/morphSingoliTag.json';
	nella cartella deve essere presente il file 'regoleBrills'+nome+'.json', fatto di un [] se vuoto o dalle regole 
	precedentemente estratte
 */
function caricaDati(cartella, nome, diz) {
	morph = require(diz);
	valide = require('./'+cartella+'/regoleBrills'+nome+'.json');
	regole = require('./'+cartella+'/regoleDaValutare'+nome+'.json');

	ritag = fs.readFileSync('./'+cartella+'/ritagPerBrill'+nome+'.txt', 'utf-8').split("\n");
	corretti = fs.readFileSync('./'+cartella+'/train'+nome+'Numeri.txt', 'utf-8').split("\n");
	staggate = fs.readFileSync('./' + cartella + '/train' + nome + 'Staggato.txt', 'utf-8').split("\n");
	/*
		Serve per organizzare i file in array di array -- NON TOGLIERE --
 	*/
	for(let frase = 0 ; frase < ritag.length ; frase++) {
		if(corretti[frase] !== undefined && ritag[frase] !== undefined) {
			ritag[frase] = ritag[frase].split(" ");
			corretti[frase] = corretti[frase].split(" ");
			staggate[frase] = staggate[frase].split(" ");
		}
	}
}

/**
	Calcola la percentuale di errori del file "ritag" rispetto al file "corretti"
	@return{Double} la percentuale
 */
function trovaErrori() {

	let tot = 0;
	let err = 0;
	for(let frase = 0 ; frase < ritag.length ; frase++) {
		if(corretti[frase] !== undefined && ritag[frase] !== undefined) {
			for(let t = 0 ; t < ritag[frase].length ; t++) {
				if(ritag[frase][t] !== corretti[frase][t])
					err++;
				tot++;
			}
		}
	}
	console.log("errori rimanenti : " + err + " / " + tot);
	return (1 - err / tot) * 100;
}


/**
	@param{int} frase: il numero della frase in ritag e corretti
	@param{int} t: la posizione all'interno della frase
	Valuta tutte le possibili regole per il tag in quella posizione e le pusha nell'array globale "regole"
	se non ci sono già
 */
function valutaPossibilita(frase, t) {
	// regola 1, precedente
	let r = { need:[], prec:"", target:"", corr:0, tipo:0 };
	if(t - 1 >= 0) {
		r = { need:[], prec:"", target:"", corr:0, tipo:1 };
		r.need.push(ritag[frase][t-1]);
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[1].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[1][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[1].push(r);
		}
	}
	// regola 2, successivo
	if(t + 1 < ritag[frase].length) {
		r = { need:[], prec:"", target:"", corr:0, tipo:2 };
		r.need.push(ritag[frase][t+1]);
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[2].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[2][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[2].push(r);
		}
	}
	// regola 3, 2 prima
	if(t - 2 >= 0) {
		r = { need:[], prec:"", target:"", corr:0, tipo:3 };
		r.need.push(ritag[frase][t-2]);
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[3].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[3][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[3].push(r);
		}
	}
	// regola 4, 2 dopo
	if(t + 2 < ritag[frase].length) {
		r = { need:[], prec:"", target:"", corr:0, tipo:4 };
		r.need.push(ritag[frase][t+2]);
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[4].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[4][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[4].push(r);
		}
	}
	// regola 5, prima x e poi y
	if(t + 1 < ritag[frase].length && t - 1 >= 0) {
		r = { need:[], prec:"", target:"", corr:0, tipo:5 };
		r.need.push(ritag[frase][t-1]);
		r.need.push(ritag[frase][t+1]);
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[5].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[5][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[5].push(r);
		}
	}
	// regola 6, prima x e 2 prima y
	if(t - 2 >= 0) {
		r = { need:[], prec:"", target:"", corr:0, tipo:6 };
		r.need.push(ritag[frase][t-1]);
		r.need.push(ritag[frase][t-2]);
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[6].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[6][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[6].push(r);
		}
	}
	// regola 7, dopo x e 2 dopo y
	if(t + 2 < ritag[frase].length) {
		r = { need:[], prec:"", target:"", corr:0, tipo:7};
		r.need.push(ritag[frase][t+1]);
		r.need.push(ritag[frase][t+2]);
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[7].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[7][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[7].push(r);
		}
	}
	// regola 8, tag x in uno dei 2 dopo
	if(t + 2 < ritag[frase].length) {
		let j = 0;
		while(j < 2) {
			r = { need:[], prec:"", target:"", corr:0, tipo:8};
			r.need.push(ritag[frase][t+1 + j]);
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.target !== r.prec && r.target !== undefined) {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[8].length && !trovato ; i++) {
					if(_.isEqual(regoleTemp[8][i], r)) trovato = true;
				}
				if(!trovato ) regoleTemp[8].push(r);
			}
			j++;
		}
	}
	// regola 9, tag x in uno dei 2 prima
	if(t - 2 >= 0) {
		let j = 0;
		while(j < 2) {
			r = { need:[], prec:"", target:"", corr:0, tipo:9};
			r.need.push(ritag[frase][t-1 - j]);
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.target !== r.prec && r.target !== undefined) {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[9].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[9][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[9].push(r);
			}
			j++;
		}
	}
	// regola 10, tag x in uno dei 3 dopo
	if(t + 3 < ritag[frase].length) {
		let j = 0;
		while(j < 3) {
			r = { need:[], prec:"", target:"", corr:0, tipo:10};
			r.need.push(ritag[frase][t+1 + j]);
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.target !== r.prec && r.target !== undefined) {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[10].length && !trovato ; i++) {
					if(_.isEqual(regoleTemp[10][i], r)) trovato = true;
				}
				if(!trovato ) regoleTemp[10].push(r);
			}
			j++;
		}
	}
	// regola 11, tag x in uno dei 3 prima
	if(t - 3 >= 0) {
		let j = 0;
		while(j < 3) {
			r = { need:[], prec:"", target:"", corr:0, tipo:11};
			r.need.push(ritag[frase][t-1 - j]);
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.target !== r.prec && r.target !== undefined) {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[11].length && !trovato ; i++) {
					if(_.isEqual(regoleTemp[11][i], r)) trovato = true;
				}
				if(!trovato ) regoleTemp[11].push(r);
			}
			j++;
		}
	}
	// regola 12, la parola prima è x
	if(t - 1 >= 0) {
		r = { need:[], prec:"", target:"", corr:0, tipo:12};
		r.need.push(staggate[frase][t-1].toLowerCase());
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[12].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[12][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[12].push(r);
		}
	}
	// regola 13, la parola	po è x
	if(t + 1 < staggate[frase].length) {
		r = { need:[], prec:"", target:"", corr:0, tipo:13};
		r.need.push(staggate[frase][t+1].toLowerCase());
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[13].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[13][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[13].push(r);
		}
	}
	// regola 14, la parola due prima è x
	if(t - 2 >= 0) {
		r = { need:[], prec:"", target:"", corr:0, tipo:14};
		r.need.push(staggate[frase][t-2].toLowerCase());
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[14].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[14][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[14].push(r);
		}
	}
	// regola 15, la parola due dopo è x
	if(t + 2 < staggate[frase].length) {
		r = { need:[], prec:"", target:"", corr:0, tipo:15};
		r.need.push(staggate[frase][t+2].toLowerCase());
		r.prec = ritag[frase][t];
		r.target = corretti[frase][t];
		if(r.target !== r.prec && r.target !== undefined) {
			let trovato = false;
			for(let i = 0 ; i < regoleTemp[15].length && !trovato ; i++) {
				if(_.isEqual(regoleTemp[15][i], r)) trovato = true;
			}
			if(!trovato ) regoleTemp[15].push(r);
		}
	}
	// regola 16, una delle due parole prima è x
	if(t - 2 >= 0) {
		let j = 0;
		while(j < 2) {
			r = { need:[], prec:"", target:"", corr:0, tipo:16};
			r.need.push(staggate[frase][t-1-j].toLowerCase());
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.target !== r.prec && r.target !== undefined) {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[16].length && !trovato ; i++) {
					if(_.isEqual(regoleTemp[16][i], r)) trovato = true;
				}
				if(!trovato ) regoleTemp[16].push(r);
			}
			j++;
		}
	}
	// regola 17, una delle due parole dopo è x
	if(t + 2 < staggate[frase].length) {
		let j = 0;
		while(j < 2) {
			r = { need:[], prec:"", target:"", corr:0, tipo:17};
			r.need.push(ritag[frase][t+1+j].toLowerCase());
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.target !== r.prec && r.target !== undefined) {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[17].length && !trovato ; i++) {
					if(_.isEqual(regoleTemp[17][i], r)) trovato = true;
				}
				if(!trovato ) regoleTemp[17].push(r);
			}
			j++;
		}
	}
}

/**
	Passa tutte le regole presenti nell'array "regole" e valuta quante volte farebbero corretto e quante sbaglierebbero
	Salva il risultati direttamente nella regola nel campo "regola.corr", ad indicare quante sarebbero le correzioni corrette in caso venisse applicata
	Salva poi le regole in './'+cartella+'/regoleDaValutare'+nome+'.json'
 */
function trovaRegolaMigliore(cartella, nome) {

	for(let reg = 0 ; reg < regole.length ; reg++ ) {		// reg : indice nelle regole
		regole[reg].corr = 0;
		// copio ritag per poter valutare quale regola è la migliore
		let ritagTemp  = [];
		for(let el of ritag) {
			ritagTemp.push([]);
			for(let e of el)
				ritagTemp[ritagTemp.length-1].push(e);
		}
		for(let frase = 0 ; frase < ritagTemp.length ; frase++) {	// passo tutte le frasi
			for(let t = 0 ; t < ritagTemp[frase].length ; t++ ) {	// t : tag attuale
				let regolaAttuale = regole[reg];
				if( (regolaAttuale.tipo === 1 && t - 1 >= 0 && ritagTemp[frase][t-1] === regolaAttuale.need[0])  || // regola 1
					(regolaAttuale.tipo === 2 && t + 1 < ritagTemp[frase].length && ritagTemp[frase][t+1] === regolaAttuale.need[0]) || // regola 2
					(regolaAttuale.tipo === 3 && t - 2 >= 0 && ritagTemp[frase][t-2] === regolaAttuale.need[0]) || // regola 3
					(regolaAttuale.tipo === 4 && t + 2 < ritagTemp[frase].length && ritagTemp[frase][t+2] === regolaAttuale.need[0]) || // regola 4
					(regolaAttuale.tipo === 5 && t + 1 < ritagTemp[frase].length && t - 1 >= 0  && // regola 5
						ritagTemp[frase][t-1] === regolaAttuale.need[0]  && ritagTemp[frase][t+1] === regolaAttuale.need[1] ) ||
					(regolaAttuale.tipo === 6 && t - 2 >= 0  && // regola 6
						ritagTemp[frase][t-1] === regolaAttuale.need[0]  && ritagTemp[frase][t-2] === regolaAttuale.need[1]) ||
					(regolaAttuale.tipo === 7 && t + 2 < ritagTemp[frase].length  && // regola 7
						ritagTemp[frase][t+1] === regolaAttuale.need[0]  && ritagTemp[frase][t+2] === regolaAttuale.need[1]) || 
					(regolaAttuale.tipo === 8 && t + 2 < ritagTemp[frase].length  && // regola 8
						(ritagTemp[frase][t+1] === regolaAttuale.need[0] || ritagTemp[frase][t+2] === regolaAttuale.need[0])) || 
					(regolaAttuale.tipo === 9 && t - 2 >= 0  && // regola 9
						(ritagTemp[frase][t-1] === regolaAttuale.need[0] || ritagTemp[frase][t-2] === regolaAttuale.need[0])) ||
					(regolaAttuale.tipo === 10 && t + 3 < ritagTemp[frase].length  && // regola 10
						(ritagTemp[frase][t+1] === regolaAttuale.need[0] || ritagTemp[frase][t+2] === regolaAttuale.need[0] || 
						ritagTemp[frase][t+3] === regolaAttuale.need[0])) || 
					(regolaAttuale.tipo === 11 && t - 3 >= 0  && // regola 11
						(ritagTemp[frase][t-1] === regolaAttuale.need[0] || ritagTemp[frase][t-2] === regolaAttuale.need[0] || 
						ritagTemp[frase][t-3] === regolaAttuale.need[0]))  ||
					(regolaAttuale.tipo === 12 && t - 1 >= 0 && 
						staggate[frase][t-1].toLowerCase() === regolaAttuale.need[0].toLowerCase()) || // regola 12 
					(regolaAttuale.tipo === 13 && t + 1 < ritagTemp[frase].length && 
						staggate[frase][t+1].toLowerCase() === regolaAttuale.need[0].toLowerCase()) ||  // regola 13
					(regolaAttuale.tipo === 14 && t - 2 >= 0 && 
						staggate[frase][t-2].toLowerCase() === regolaAttuale.need[0].toLowerCase())  || // regola 14
					(regolaAttuale.tipo === 15 && t + 2 < ritagTemp[frase].length && 
						staggate[frase][t+2].toLowerCase() === regolaAttuale.need[0].toLowerCase()) || // regola 15
					(regolaAttuale.tipo === 16 && t - 2 >= 0  && // regola 16
						(staggate[frase][t-1].toLowerCase() === regolaAttuale.need[0].toLowerCase() || 
						staggate[frase][t-2].toLowerCase() === regolaAttuale.need[0].toLowerCase()))  ||
					(regolaAttuale.tipo === 17 && t + 2 < ritagTemp[frase].length  && // regola 17
						(staggate[frase][t+1].toLowerCase() === regolaAttuale.need[0].toLowerCase() || 
						staggate[frase][t+2].toLowerCase() === regolaAttuale.need[0].toLowerCase()))) 
				{
					if(ritagTemp[frase][t] === regolaAttuale.prec) {
						// controllo se è rispettato il tag prec 
						regolaAttuale.corr = (corretti[frase][t] === regolaAttuale.target) ? regolaAttuale.corr+1 :regolaAttuale.corr-1;
				    	ritagTemp[frase][t] = regolaAttuale.target;
					}
				}
			}
		}

		// per file di grandi dimensioni se trova regole con correzioni < 0 le toglie dalle possibili in modo da averne meno poi da controllare
		// si può togliere questo if per file di piccole dimensioni o se si vuole maggiore precisione a discapito del tempo
		// if(regole[reg].corr < 1) {
		// 	regole.splice(reg, 1);
		// 	reg--;
		// }
	}
	fs.writeFileSync('./'+cartella+'/regoleDaValutare'+nome+'.json', JSON.stringify(regole), 'utf-8');
}

/**
	Cerca in "regole" la regola migliore. L'array delle regole deve essere ordinato in maniera decrescente
	Controlla che non sia già presente nell'array "valide" e la pusha
	@return{Boolean} true se ci sono regole con correzioni > 0 e ancora non presenti nelle valide
 */
function estraiPiuPromettente() { 
	for(let i = 0 ; i < regole.length ; i++) {
		let trovato = false;
		if( (regole[i].corr) <= 1)
			return false;
		for(let act = 0 ; act < valide.length && !trovato ; act++) 
			trovato = utils.regoleUguali(regole[i], valide[act]);
		
		if(!trovato) {
			valide.push(regole[i]);
			regole.splice(i, 1);
			return true;
		}		
	}
	return false;
}

/**
	Usa l'ultima regola nell'array "valide" per ritaggare il file ritag
 */
function ritagga() {
	let last = valide[valide.length-1];
	tot.push(0);
	for(let frase = 0 ; frase < ritag.length ; frase++) {
		if(ritag[frase] !== undefined) {
			for(let tag = 0 ; tag < ritag[frase].length ; tag++) {
				if( (last.tipo === 1 && tag - 1 >= 0 && ritag[frase][tag-1] === last.need[0] ) ||	// 1 tag prima
					(last.tipo === 2 && tag + 1 < ritag[frase].length && ritag[frase][tag+1] === last.need[0]) || // 1 tag dopo
					(last.tipo === 3 && tag - 2 >= 0 && ritag[frase][tag-2] === last.need[0]) || // 2 tag prima
					(last.tipo === 4 && tag + 2 < ritag[frase].length && ritag[frase][tag+2] === last.need[0]) || // 2 tag dopo
					(last.tipo === 5 && tag + 1 < ritag[frase].length && tag - 1 >= 0 && 	// x prima e y dopo
						ritag[frase][tag+1] === last.need[1] && ritag[frase][tag-1] === last.need[0]) ||
					(last.tipo === 6 && tag - 2 >= 0 &&	ritag[frase][tag-1] === last.need[0] && // x e y prima
						ritag[frase][tag-2] === last.need[1]) ||
					(last.tipo === 7 && tag + 2 < ritag[frase].length && // x e y dopo
						ritag[frase][tag+1] === last.need[0] && ritag[frase][tag+2] === last.need[1]) ||
					(last.tipo === 8 && tag + 2 < ritag[frase].length && // x in uno dei 2 dopo
						(ritag[frase][tag+1] === last.need[0] || ritag[frase][tag+2] === last.need[0])) ||
					(last.tipo === 9 && tag - 2 >= 0 && 	// x in uno dei 2 prima
						(ritag[frase][tag-1] === last.need[0] || ritag[frase][tag-2] === last.need[0])) ||
					(last.tipo === 10 && tag + 3 < ritag[frase].length && // x in uno dei 3 dopo
						(ritag[frase][tag+1] === last.need[0] || ritag[frase][tag+2] === last.need[0] || 
						ritag[frase][tag+3] === last.need[0])) ||
					(last.tipo === 11 && tag - 3 >= 0 && // x in uno dei 3 prima
						(ritag[frase][tag-1] === last.need[0] || ritag[frase][tag-2] === last.need[0] 
						|| ritag[frase][tag-3] === last.need[0]) ) ||
					(last.tipo === 12 && tag - 1 >= 0 && staggate[frase][tag-1].toLowerCase() === last.need[0].toLowerCase()) || // parola x prima 
					(last.tipo === 13 && tag + 1 < staggate[frase].length && // parola x dopo
						staggate[frase][tag+1].toLowerCase() === last.need[0].toLowerCase()) ||
					(last.tipo === 14 && tag - 2 >= 0 && staggate[frase][tag-2].toLowerCase() === last.need[0].toLowerCase()) ||  // parola x 2 prima
					(last.tipo === 15 && tag + 2 < staggate[frase].length && staggate[frase][tag+2].toLowerCase() === last.need[0].toLowerCase()) || // parola x 2 dopo
					(last.tipo === 16 && tag - 2 >= 0 && (staggate[frase][tag-1].toLowerCase() === last.need[0].toLowerCase()  // parola x in uno dei 2 prima
						|| staggate[frase][tag-2].toLowerCase() === last.need[0].toLowerCase())) ||
					(last.tipo === 17 && tag + 2 < staggate[frase].length && // parola x in uno dei 2 dopo
						(staggate[frase][tag+1] === last.need[0] || staggate[frase][tag+2].toLowerCase() === last.need[0].toLowerCase()))) {
							if(ritag[frase][tag] === last.prec) {
								// ritaggo
								ritag[frase][tag] = last.target;
								tot[tot.length-1]++;
							}
						}
			}
		}
	}
}

/**
	Crea le regole all'inizio
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file (lo stesso nome usato per inizializzare i file)
	salva le regole in './'+cartella+'/regoleDaValutare'+nome+'.json'
 */
function valutaRegole(cartella, nome) {
	regole = [];
	// per migliorare i tempi d'esecuzione
	regoleTemp = {1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[],10:[],11:[],12:[],13:[],14:[],15:[],16:[],17:[]};
	let startTime = new Date().getTime();
	// trovo le possibili regole che correggono
	for(let frase = 0 ; frase < ritag.length ; frase++) {
		if(corretti[frase] !== undefined && ritag[frase] !== undefined) {
			for(let t = 0 ; t < ritag[frase].length ; t++) {
				if(ritag[frase][t] !== corretti[frase][t]) {
					// valuto tutte le possibilità
					valutaPossibilita(frase, t);
				}	
			}
		}
	}
	for(let el in regoleTemp) {
		for(let e of regoleTemp[el]) {
			regole.push(e);
		}
	}
	console.log("regole create in : " + (new Date().getTime()-startTime) / 60000 + " minuti");
	console.log("trovate " + regole.length + " regole");
	fs.writeFileSync('./'+cartella+'/regoleDaValutare'+nome+'.json', JSON.stringify(regole), 'utf-8');
}

/**
	Trova un numero di nuove regole pari a (to-valide.length) o fino a quando la regola più promettente farebbe 0 cambi positivi
	@param{int} to: numero di regole a cui arrivare
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file (lo stesso nome usato per inizializzare le regole)
	Quando arriva ad avere "to" regole in "valide" salva il file ritag in './'+cartella+'/ritagPerBrill'+nome+'.txt' e
	le regole valide in './'+cartella+'/regoleBrills'+nome+'.json'
 */
function trovaRegole(to, cartella, nome) {
	let start = valide.length;

	while(start < to) {
		console.log("inizio giro  : " + start);
		console.log(trovaErrori() + "%");
		let startTime = new Date().getTime();
		
		// le regole vengono valutate all'inizio per file di grandi dimensioni e poi vengono semplicemente azzerate ogni volta
		// se si vuole maggiore precisione a discapito del tempo scommentare la successiva riga
		valutaRegole(cartella, nome);
		
		// ho tutte le regole, devo vedere quale è la migliore
		trovaRegolaMigliore(cartella, nome);
		console.log("numero di regole : " + regole.length);
		// ho valutato tutte le regole, adesso devo prendere la migliore e ritaggare
		regole.sort(function(a,b){ return b.corr - a.corr ; });
		if(estraiPiuPromettente(cartella, nome)) { 	
			ritagga();
			console.log((new Date().getTime()-startTime) / 60000 + " minuti");
			console.log(valide[valide.length - 1]);
			console.log(trovaErrori() + "%");
			console.log("finito giro  : " + start);
			if(valide[valide.length - 1].corr <= 1)
				break;
			start++;
			console.log();
			ris  = "";
			for(let qq of ritag) {
				let parz = "";
				for(let el of qq)
					parz +=el+" ";
				ris+=parz.substring(0,parz.length-1)+"\n";
			}
			fs.writeFileSync('./'+cartella+'/ritagPerBrill'+nome+'.txt', ris.substring(0, ris.length - 1), 'utf-8');
			fs.writeFileSync('./'+cartella+'/regoleBrills'+nome+'.json', JSON.stringify(valide), 'utf-8');
		}
		else 
			break;
	}
	// fs.writeFileSync('./'+cartella+'/ritagPerBrill'+nome+'.txt', ris.substring(0, ris.length - 1), 'utf-8');
	// fs.writeFileSync('./'+cartella+'/regoleBrills'+nome+'.json', JSON.stringify(valide), 'utf-8');
}

module.exports = {

	inizializzaPerRegole: inizializzaPerRegole,
	caricaDati: caricaDati,
	valutaRegole: valutaRegole,
	trovaRegole: trovaRegole

};