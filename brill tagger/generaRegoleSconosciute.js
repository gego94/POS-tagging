const _ = require('lodash');
const fs = require('fs');
const utils = require('./utils.js');

let  valideScon, ritag, corretti, staggate, regoleScon, sconosciute, morph, regoleTemp = {1:[],2:[],3:[],4:[],5:[]} ;

morph = require('./morphSingoliTag.json');
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
	Stagga il file di train 
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file
	@param{String} train: nome del file di train senza estensione --> accetta solo file in txt
	Scrive su file su './' + cartella + '/dict' + nome + '.json' il risultato della staggatura
 */
function stagga(cartella, nome, train) {
	let ris = "";
	let file = fs.readFileSync('./' + cartella + '/' + train + '.txt', 'utf-8').split("\n");
	for(let frase of file) {
		let fr = frase.split(" ");
		let parz = "";
		for(let el = 0 ; el < fr.length ; el++) {
			let spl = fr[el].split("_");
			if( spl[0] !== undefined) {
				if(el !== fr.length - 1)
					parz += spl[0] + " ";
				else
					parz += spl[0];
			}
		}
		ris += parz.substring(0,parz.length) + "\n";
	}
	fs.writeFileSync('./' + cartella + '/train' + nome + 'Staggato.txt', ris.substring(0,ris.length-3), 'utf-8');
}

/** 
	Usa il dizionario per taggare './'+cartella+'/train'+nome+'Staggato.txt'
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file
	Scrive su file denominato './'+cartella+'/ritagPerBrill'+nome+'.txt' il file precedentemente staggato
 */
function taggaPerBrill(cartella, nome) {
	let ris = "";
	let file = fs.readFileSync('./'+cartella+'/train'+nome+'Staggato.txt','utf-8').split('\n');
	for(let frase of file) {
		let t = taggaFrase(frase);
		let part = "";
		for(let parola of t) 
			part += tags[parola] + " ";
			
		ris += part.substring(0, part.length-1) + "\n";
	}
	fs.writeFileSync('./'+cartella+'/ritagPerBrill'+nome+'.txt', ris.substring(0, ris.length-1), 'utf-8');
}

/**
	Traduce i tag del file './'+cartella+'/'+nomeTrain+'.txt' in numeri
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file
	@param{String} nomeTrain: nome del file di train senza estensione --> accetta solo file in txt
	Scrive su file denominato './'+cartella'/train'+nome+'Numeri.txt' il file con i tag tradotti in numero
 */
function traduciTrainPerBrill(cartella, nome, nomeTrain) {
	let ris = "";
	let file = fs.readFileSync('./'+cartella+'/'+nomeTrain+'.txt','utf-8').split('\n');
	for(let frase of file) {
		let fr = frase.split(" ");
		let part = "";
		for(let parola of fr) {
			if(parola.split("_")[1] !== undefined) {
				let s = "_" + parola.split("_")[1].trim();
				if(tags[s] !== undefined)
					part += tags[s] + " ";
			}
		}
		ris += part.substring(0, part.length-1) + "\n";
	}
	fs.writeFileSync('./'+cartella+'/train'+nome+'Numeri.txt', ris.substring(0, ris.length-3), 'utf-8');
}

/**
 	Traduce il file './'+cartella+'/'+nomeTrain+'.txt' in un'altro file dove le parole sconosciute sono taggate come 1 
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file
	@param{String} nomeTrain: nome del file di train senza estensione --> accetta solo file in txt
	Scrive su file denominato './'+cartella+'/sconosciute'+nome+'.txt' il file
 */
function creaSconosciute(cartella, nome, nomeTrain) {
	let ris = "";
	let file = fs.readFileSync('./'+cartella+'/'+nomeTrain+'.txt','utf-8').split('\n');
	for(let frase of file) {
		let fr = frase.split(" ");
		let part = "";
		for(let parola of fr) {
			let s = parola.split("_")[0].toLowerCase();
			if(s !== undefined) {
				if(morph[s.trim()] === undefined)
					part += "1 ";
				else
					part += "0 ";
			}
		}
		ris += part.substring(0, part.length-1) + "\n";
	}
	fs.writeFileSync('./'+cartella+'/sconosciute'+nome+'.txt', ris.substring(0, ris.length-3), 'utf-8');
}

/**
	Chiama le funzioni per inizializzare i dati per addestrare brill
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file
	@param{String} nomeTrain: nome del file di train senza estensione --> accetta solo file in txt
 */
function inizializzaPerRegole(cartella, nome, nomeTrain) {
	stagga(cartella, nome, nomeTrain);
	taggaPerBrill(cartella, nome);
	traduciTrainPerBrill(cartella, nome, nomeTrain);
	creaSconosciute(cartella, nome, nomeTrain);
	fs.writeFileSync('./'+cartella+'/regoleBrillsScon'+nome+'.json', "[]", 'utf-8');
	fs.writeFileSync('./'+cartella+'/regoleDaValutareScon'+nome+'.json', "[]", 'utf-8');
}

/**
	Carica i dati per poter usare il tagger
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per caricare i file (lo stesso nome usato per inizializzare le regole)
	nella cartella deve essere presente il file 'regoleBrills'+nome+'.json', fatto di un [] se vuoto o dalle regole 
	precedentemente estratte
 */
function caricaDati(cartella, nome, dict) {
	morph = require(dict);
	valideScon = require('./'+cartella+'/regoleBrillsScon'+nome+'.json');
	regoleScon = require('./'+cartella+'/regoleDaValutareScon'+nome+'.json');

	ritag = fs.readFileSync('./'+cartella+'/ritagPerBrill'+nome+'.txt', 'utf-8').split("\n");
	corretti = fs.readFileSync('./'+cartella+'/train'+nome+'Numeri.txt', 'utf-8').split("\n");
	staggate = fs.readFileSync('./' + cartella + '/train' + nome + 'Staggato.txt', 'utf-8').split("\n");
	sconosciute = fs.readFileSync('./'+cartella+'/sconosciute'+nome+'.txt', 'utf-8').split("\n");
	/*
		Serve per organizzare i file in array di array -- NON TOGLIERE --
 	*/
	for(let frase = 0 ; frase < ritag.length ; frase++) {
		if(corretti[frase] !== undefined && ritag[frase] !== undefined) {
			ritag[frase] = ritag[frase].split(" ");
			corretti[frase] = corretti[frase].split(" ");
			staggate[frase] = staggate[frase].split(" ");
			sconosciute[frase] = sconosciute[frase].split(" ");
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
function valutaPossibilitaPerSconosciute(frase, t) {
	let r = { need:[], prec:"", target:"", corr:0, tipo:0 };
	let p = staggate[frase][t].toLowerCase();
	if(/^[a-zA-ZÀ-ÖØ-öø-ÿ\']+$/.test(p)) {
		if(p.length >= 3) {	//regola 1 se il suffisso di 2 è x
			r = { need:[], prec:"", target:"", corr:0, tipo:1 };
			r.need.push(p.substring(p.length-2, p.length).toLowerCase());
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.prec !== r.target && r.target !== undefined && r.target !== '14') {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[1].length && !trovato ; i++) {
					if(utils.regoleUguali(regoleTemp[1][i], r)) trovato = true;
				}
				if(!trovato);regoleTemp[1].push(r);
			}
		}
		if(p.length >= 4) {	//regola 2 se il suffisso di 3 è x
			r = { need:[], prec:"", target:"", corr:0, tipo:2 };
			r.need.push(p.substring(p.length-3, p.length).toLowerCase());
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.prec !== r.target && r.target !== undefined && r.target !== '14') {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[2].length && !trovato ; i++) {
					if(utils.regoleUguali(regoleTemp[2][i], r)) trovato = true;
				}
				if(!trovato) regoleTemp[2].push(r);
			}
		}
		if(p.length >= 5) {	//regola 3  se il suffisso di 4 è x
			r = { need:[], prec:"", target:"", corr:0, tipo:3 };
			r.need.push(p.substring(p.length-4, p.length).toLowerCase());
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.prec !== r.target && r.target !== undefined && r.target !== '14') {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[3].length && !trovato ; i++) {
					if(utils.regoleUguali(regoleTemp[3][i], r)) trovato = true;
				}
				if(!trovato) regoleTemp[3].push(r);
			}
		}
		if(t - 1 >= 0 && /^[a-zA-ZÀ-ÖØ-öø-ÿ\']+$/.test(staggate[frase][t-1])) {	//regola 4 se la parola prima è x
			r = { need:[], prec:"", target:"", corr:0, tipo:4 };
			r.need.push(staggate[frase][t-1].toLowerCase());
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.prec !== r.target && r.target !== undefined && r.target !== '14') {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[4].length && !trovato ; i++) {
					if(utils.regoleUguali(regoleTemp[4][i], r)) trovato = true;
				}
				if(!trovato) regoleTemp[4].push(r); 
			}
		}
		if(t + 1 < staggate[frase].length && /^[a-zA-ZÀ-ÖØ-öø-ÿ\']+$/.test(staggate[frase][t+1]) ) {	//regola 5 se la parola dopo è x
			r = { need:[], prec:"", target:"", corr:0, tipo:5 };
			r.need.push(staggate[frase][t+1].toLowerCase());
			r.prec = ritag[frase][t];
			r.target = corretti[frase][t];
			if(r.prec !== r.target && r.target !== undefined && r.target !== '14') {
				let trovato = false;
				for(let i = 0 ; i < regoleTemp[5].length && !trovato ; i++) {
					if(utils.regoleUguali(regoleTemp[5][i], r)) trovato = true;
				}
				if(!trovato) regoleTemp[5].push(r); 
			}
		}
	}

}

/**
	Passa tutte le regole presenti nell'array "regoleScon" e valuta quante volte farebbero corretto e quante sbaglierebbero
	Salva il risultati direttamente nella regola nei campi "regola.corr"
 */
function trovaRegolaMiglioreScon() {
	for(let reg = 0 ; reg < regoleScon.length ; reg++ ) {		// reg : indice nelle regole
		let regolaAttuale = regoleScon[reg];
		let ritagTemp  = [];
		for(let el of ritag) {
			ritagTemp.push([]);
			for(let e of el)
				ritagTemp[ritagTemp.length-1].push(e);
		}
		for(let frase = 0 ; frase < ritag.length ; frase++) {	// passo tutte le frasi
			for(let t = 0 ; t < ritag[frase].length ; t++ ) {	// t : tag attuale
				if(sconosciute[frase][t] === "1") {	// valuto le regole solo sulle parole sconsociute 
					if(((regolaAttuale.tipo === 1  || regolaAttuale.tipo === 2 || regolaAttuale.tipo === 3) && 
						staggate[frase][t].toLowerCase().endsWith(regolaAttuale.need[0].toLowerCase())) ||	// regola 1,2,3 si valutano tutte con endsWith
						(regolaAttuale.tipo === 4 && staggate[frase][t-1] !== undefined && staggate[frase][t-1].toLowerCase() === regolaAttuale.need[0].toLowerCase()) ||	// regola 4 parola prima
						(regolaAttuale.tipo === 5 && staggate[frase][t+1] !== undefined && staggate[frase][t+1].toLowerCase() === regolaAttuale.need[0].toLowerCase()))	// regola 5 parola dopo
					{
						if(ritagTemp[frase][t] === regolaAttuale.prec) {
							ritagTemp[frase][t] = regolaAttuale.target;
							regolaAttuale.corr = (corretti[frase][t] === regolaAttuale.target) ? regolaAttuale.corr+1 : regolaAttuale.corr-1;
						}
					}
				}
			}
		}
	}
}

/**
	Cerca in "regoleScon" la regola migliore. L'array delle regole deve essere ordinato in maniera decrescente
	Controlla che non sia già presente nell'array "valideScon" e la pusha
 */
function estraiPiuPromettenteScon() {
	for(let i = 0 ; i < regoleScon.length ; i++) {
		let trovato = false;
		if( (regoleScon[i].corr) <= 1)
			return false;
		for(let act = 0 ; act < valideScon.length && !trovato ; act++) 
			trovato = utils.regoleUguali(regoleScon[i], valideScon[act]);
		
		if(!trovato) {
			valideScon.push(regoleScon[i]);
			regoleScon.splice(i, 1);
			return true;
		}		
	}
	return false;
}

/**
	Usa l'ultima regola nell'array "valide" per ritaggare il file ritag
 */
function ritaggaScon() {
	let last = valideScon[valideScon.length-1];
	for(let frase = 0 ; frase < ritag.length ; frase++) {
		if(ritag[frase] !== undefined) {
			for(let tag = 0 ; tag < ritag[frase].length ; tag++) {
				if(	sconosciute[frase][tag] === "1") {	// applico le regole solo alle parole sconosciute
					if(((last.tipo === 1 || last.tipo === 2 || last.tipo === 3) && 
						staggate[frase][tag].toLowerCase().endsWith(last.need[0].toLowerCase())) ||
					(last.tipo === 4 && staggate[frase][tag-1] !== undefined && staggate[frase][tag-1].toLowerCase() === last.need[0].toLowerCase())  || 
					(last.tipo === 5 && staggate[frase][tag+1] !== undefined && staggate[frase][tag+1].toLowerCase() === last.need[0].toLowerCase())	
						) {
							if(ritag[frase][tag] === last.prec) {
								// cambio il tag se rispetto la regola
								ritag[frase][tag] = last.target;
							}
						}
				}
			}
		}
	}
}

/**
	Azzera il campo corr di ogni regola
 */
function azzeraRegoleScon() {
	for(let i = 0 ; i < regoleScon.length ; i++) {
		regoleScon[i].corr = 0;
	}
}

function valutaRegoleScon(cartella, nome) {
	regoleScon = [];
	regoleTemp = {1:[],2:[],3:[],4:[],5:[]}
	console.log("valuto le regole per le sconosciute");
	let startTime = new Date().getTime();
	// trovo le possibili regole che correggono
	for(let frase = 0 ; frase < sconosciute.length ; frase++) {
		for(let t = 0 ; t < sconosciute[frase].length ; t++) {
			if(sconosciute[frase][t] === "1" && corretti[frase][t] !== ritag[frase][t]) {
				// valuto tutte le possibilità
				valutaPossibilitaPerSconosciute(frase, t);
			}	
		}
	}
	for(let el in regoleTemp) {
		for(let e of regoleTemp[el]) {
			regoleScon.push(e);
		}
	}
	console.log("regole totali : " + regoleScon.length);
	console.log("regole create in : " + (new Date().getTime()-startTime) / 60000 + " minuti");
	fs.writeFileSync('./'+cartella+'/regoleDaValutareScon'+nome+'.json', JSON.stringify(regoleScon), 'utf-8');
}


/**
	Trova un numero di nuove regole pari a (to-valide.length) o fino a quando la regola più promettente farebbe 1 cambio positivo
	@param{int} to: numero di regole a cui arrivare
	@param{String} cartella: percorso della cartella relativo senza ./  --> ad esempio nuovaCartella/Altracartella
	@param{String} nome: nome per salvare i file (lo stesso nome usato per inizializzare le regole)

 */
function trovaRegoleScon(to, cartella, nome) {
	let start = valideScon.length;
	

	while(start < to) {
		console.log("inizio giro  : " + start);
		let startTime = new Date().getTime();
		console.log(trovaErrori() + "%");
		
		// azzeraRegoleScon();
		valutaRegoleScon(cartella, nome);

		// ho tutte le regole, devo vedere quale è la migliore
		trovaRegolaMiglioreScon();
		// ho valutato tutte le regole, adesso devo prendere la migliore e ritaggare
		regoleScon.sort(function(a,b){ return b.corr-a.corr});
		if(estraiPiuPromettenteScon()) {
			
			ritaggaScon();
			console.log((new Date().getTime()-startTime) / 60000 + " minuti");
			console.log(valideScon[valideScon.length - 1]);
			console.log(trovaErrori() + "%");
			console.log("finito giro  : " + start + " --> positivi : " + valideScon[valideScon.length - 1].corr );
			if(valideScon[valideScon.length - 1].corr <= 0)
				break;
			start++;
			console.log();
		}
		else 
			break;
	}
	ris  = "";
	for(let qq of ritag) {
		let parz = "";
		for(let el of qq)
			parz +=el+" ";
		ris+=parz.substring(0,parz.length-1)+"\n";
	}
	fs.writeFileSync('./'+cartella+'/ritagPerBrill'+nome+'.txt', ris.substring(0, ris.length - 1), 'utf-8');
	fs.writeFileSync('./'+cartella+'/regoleBrillsScon'+nome+'.json', JSON.stringify(valideScon), 'utf-8');
}

module.exports = {

	inizializzaPerRegole:inizializzaPerRegole,
	caricaDati:caricaDati,
	valutaRegoleScon:valutaRegoleScon,
	trovaRegoleScon:trovaRegoleScon

};