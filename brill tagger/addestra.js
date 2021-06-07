const reg = require('./generaRegole.js');
const scon = require('./generaRegoleSconosciute.js');

/**
	Addestra il brillTagger
	@param{String} cartella: il nome della cartella dove creare, caricare e salvare i risultati (va scritto solo il nome, es: c1 o c1/c2 no ./c1)
	@param{String} nome: il nome che si vuole dare ai file. Viene usato poi per caricare i file creati
	@param{String} train: nome del file di train (solo il nome senza ./ e senza .txt)
	@param{String} dict: il percorso completo del dizionario
	@param{Integer} numeroRegole: il numero

 */
function addestra(cartella, nome, train, dict, numeroRegole, numeroRegoleScon) {
	// crea i file iniziali nella cartella 'res' con nome 'zucc' usando come train il file zuccItaTaggatePrepArtTrain
	// se si interrompe il train in qualche punto delle regole delle sconosciute comemntare la riga successiva
	scon.inizializzaPerRegole(cartella, nome, train);

	// carica i dati dalla cartella res con nome zucc
	scon.caricaDati(cartella, nome, dict);

	// trova le regole migliori in base al file 'regoleBrillsDaValutare' creato dal metodo valutaRegoleScon nella cartella res con nome zucc
	// e trova le prime numeroRegoleScon... salva ad ogni iterazione i cambiamenti nella cartella 'res'
	scon.trovaRegoleScon(numeroRegoleScon, cartella, nome);

	// se si interrompe il train a qualche punto delle regole normali e non sonosciute commentare le righe precedenti

	// crea i file per salvare le regole nella cartella 'res' con nome zucc usando il 'trainzuccItaTaggatePrepArtTrain' 
	// se si interrompe il train durante le regole normali commentare questa riga, sennò resetta i file
	reg.inizializzaPerRegole(cartella, nome, train);

	// carica i dati presenti nella cartella 'res' con nome 'zucc' e il dizionario per taggare. Usa i file creati da 'generaRegoleSconosciute'
	reg.caricaDati(cartella, nome, dict);

	// per avere un addestramento più veloce scommentare la riga successiva e commentare  'valutaRegole' nel metodo 'trovaregole'. In questo modo,
	// le regole verranno create solo all'inizio e non ad ogni iterazione. Ad ogni iterazione verrà semplicemente valutato il loro impatto sul corpus
	// e tenuta la regola migliore.
	// Se si vuole ancora più velocità, a discapito di un po di precisione, oltre a valutare solo le regole all'inziio, è possibile scommentare 
	// le ultime righe del metodo 'trovaregolaMigliore'. In questo modo, le regole che all'inizio apportano più cambiamenti negativi che positivi,
	// verranno tolte dalle regole possibili.
	// reg.valutaRegole(cartella, nome);


	// trova le prime numeroRegole regole valide o fino a quando la prima regola da 1 cambiamento positivo e le salva nel file'regoleBrillsZucc' nella cartella 'res'.
	// Ad ogni iterazione salva i cambiamenti nella cartella res.
	// se si interrompe l'addestramento, commentare il metodo 'inizializzaPerRegole', altrimenti resetterà i file dove sono salvate le regole
	// ed inoltre, bisognerebbe riaddestrare le regole sconosciute in quanto il file ritag, contenente i tag con le modifiche apportate dalle 
	// regole trovate fino a quel momento non sarebbe più valido.
	reg.trovaRegole(numeroRegole, cartella, nome);
}

// addestra('res', 'zucc', 'zuccItaTaggatePrepArtTrain', './morphSingoliTag.json', 500, 200);

var myArgs = process.argv.slice(2);
addestra(myArgs[0], myArgs[1], myArgs[2], myArgs[3], myArgs[4], myArgs[5]);