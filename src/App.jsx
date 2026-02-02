import { useState, useEffect, useRef } from 'react'; 
import './App.scss';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import { fetchPotmData } from './services/api';
import ProgressBar from './components/ProgressBar/ProgressBar';
import AnimatedNumber from './components/AnimatedNumber/AnimatedNumber';

import { db } from './services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { dataLayerPushView, incrementCounterViews } from './services/analytics';
import 'flag-icons/css/flag-icons.min.css';



import iconTrophy from './assets/img/icon-trophy.svg';
// Import dynamique des drapeaux


function getDistributedPercentages(players) {
    if (!players || players.length === 0) return [];
    
    const totalVotes = players.reduce((acc, p) => acc + (p.votes || 0), 0);
    if (totalVotes === 0) return players.map(() => 0);

    const rawPercentages = players.map(p => ((p.votes || 0) / totalVotes) * 100);
    const integerParts = rawPercentages.map(p => Math.floor(p));
    const decimalParts = rawPercentages.map((p, i) => ({ val: p - integerParts[i], index: i }));
    
    const sumIntegers = integerParts.reduce((a, b) => a + b, 0);
    const diff = 100 - sumIntegers;

    // Sort by decimal part descending
    decimalParts.sort((a, b) => b.val - a.val);

    // Distribute remainder
    for (let i = 0; i < diff; i++) {
        integerParts[decimalParts[i].index]++;
    }
    
    return integerParts;
}

function App({ gridMode = false }) {
    
    const [docId, setDocId] = useState(null);
    const [potm, setPotm] = useState(null);
    const [devMode, setDevMode] = useState(false);
    const [isGrid, setIsGrid] = useState(gridMode);
    const [hasVoted, setHasVoted] = useState(false);
    const [showNbVotes, setShowNbVotes] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showWinnerHighlight, setShowWinnerHighlight] = useState(false);

    // Fonction pour capitaliser la première lettre
    const capitalize = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        // If it's a Firestore timestamp (seconds check)
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const showFinalResults = (total) => {
        setShowResults(true);
        if (total >= 100) setShowNbVotes(true);
        
        // Highlight winner after results animation (1.5s)
        setTimeout(() => {
            setShowWinnerHighlight(true);
        }, 1500);
    };

    const voteHandler = async (playerIndex) => {
        if (hasVoted || !docId) return;

        // Optimistic update
        const newTotal = (potm.totalVotes || 0) + 1;
        const newPlayers = potm.players ? [...potm.players] : [];
        
        if (newPlayers[playerIndex]) {
             newPlayers[playerIndex] = {
                ...newPlayers[playerIndex],
                votes: (newPlayers[playerIndex].votes || 0) + 1 
             };
        }

        const optimisticPotm = { 
            ...potm, 
            totalVotes: newTotal, 
            players: newPlayers 
        };

        setPotm(optimisticPotm);
        setHasVoted(true);

        if (newTotal >= 100) {
            showFinalResults(newTotal);
        } else {
             showFinalResults(newTotal);
        }

        // Persist vote ONLY if not in dev mode (so reloading in dev mode allows re-voting)
        if (!devMode) {
             localStorage.setItem('potmVoted_' + docId, 'true');
        }

        try {
            const potmRef = doc(db, 'embeds', docId);
            await runTransaction(db, async (transaction) => {
                const potmDoc = await transaction.get(potmRef);
                if (!potmDoc.exists()) throw 'Document does not exist!';
                
                const data = potmDoc.data();
                const currentDbTotal = (data.totalVotes || 0) + 1;
                
                const dbPlayers = data.players || [];
                if (dbPlayers[playerIndex]) {
                     dbPlayers[playerIndex].votes = (dbPlayers[playerIndex].votes || 0) + 1;
                }
                
                // On met aussi à jour le vote spécifique du joueur si besoin, 
                // mais la requête demande seulement totalVotes pour l'instant.
                transaction.update(potmRef, { 
                    totalVotes: currentDbTotal,
                    players: dbPlayers
                });
            });

            // Refresh local state to ensure consistency (eventually consistent)
            fetchPotmData(docId).then(data => {
                if (data) setPotm(data);
            });
            
        } catch (e) {
            console.error('Transaction failed: ', e);
            setHasVoted(false); // Rollback state on error
            setPotm(potm); // Rollback optimistic data
        }
    };

   
    // function fetchResults() {
    //     // Récupère la donnée à jour après les votes
    //     if (docId) {
    //         fetchPotmData(docId).then(data => {
    //             setPotm(data);
    //             // console.log('Affichage direct dans fetchResults :', JSON.stringify(data.tinderCards, null, 2));
                
    //         });
    //     }
    // }

  

    // Fonction exécutée lorsque la page est chargée
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const potmDoc = urlParams.get('potmDoc'); 
        const isDev = urlParams.get('dev') === 'true';

        if (isDev) setDevMode(false);

        if (!potmDoc) {
            console.log('Aucun potm trouvé.');
            return;
        }

        setDocId(potmDoc); 

        async function loadPotm() {
            const data = await fetchPotmData(potmDoc); 
            //console.log('Données chargées:', data); // Vérifier les données reçues
            setPotm(data); 
            
            // Check if already voted
            const alreadyVoted = localStorage.getItem('potmVoted_' + potmDoc);
            // If in dev mode, we IGNORE the cookie, allowing a new vote this session
            if (alreadyVoted && !devMode) {
                setHasVoted(true);
                // Trigger results view immediately
                const currentTotal = data.totalVotes || 0;
                showFinalResults(currentTotal);
            }
            
            // Appeler la fonction dataLayer pour l'impression/affichage
            //dataLayerPushView(quizDoc);
            
            // Incrémenter le compteur de vues
            //await incrementViewCounter(quizDoc);
        }

        loadPotm();
    }, []); // Le tableau de dépendances vide signifie que cet effet est exécuté une seule fois.

   

   
 
   

    

     

    useEffect(() => {
      if (docId) {
        incrementCounterViews(docId);
        dataLayerPushView(docId)
      }
    }, [docId]);  

    return (
        <div className="App overflow-hidden relative px-2.5 sm:px-5 pt-5 pb-10 font-inter">
            

            {devMode && (
                <div className="absolute top-2 right-2 z-50">
                    <button 
                        onClick={() => setIsGrid(!isGrid)}
                        className="bg-black/50 text-white text-[10px] px-2 py-1 rounded hover:bg-black/70 transition-colors uppercase font-bold tracking-wider"
                    >
                        {isGrid ? 'Switch to List' : 'Switch to Grid'}
                    </button>
                </div>
            )}
            <div className="text-center">
                <img src={iconTrophy} alt="Trophy Icon" className="mx-auto mb-2"/>
                <h1 className='text-xl sm:text-2xl leading-6 mb-3'>
                    {potm && potm.context?.category === 'Dames' ? "Qui est votre femme du match?" : "Qui est votre homme du match?"} 
                </h1>

                <p>
                    {potm ? (
                        <>
                            <span>{potm.context?.text}</span> 
                            <br />
                            <span className="text-xs">{formatDate(potm.context?.date)}</span>
                        </>
                    ) : 'Chargement...'}
                </p>
            </div>


            {isGrid ? (
                <div className="grid grid-cols-2 gap-2">
                    <ul className="grid auto-rows-fr gap-2">
                        {potm && potm.players && (() => {
                            const percentages = getDistributedPercentages(potm.players);
                            const maxPercentage = Math.max(...percentages);
                            
                            return potm.players.slice(0, Math.ceil(potm.players.length / 2)).map((player, index) => {
                                const percentage = percentages[index];
                                const isWinner = percentage === maxPercentage;

                                return (
                                <li 
                                    key={index} 
                                    className={`flex items-center relative gap-2 px-3 py-4 transition-all duration-500 ${!hasVoted ? 'can-vote' : ''} ${showWinnerHighlight && !isWinner ? 'dimmed' : ''}`}
                                    onClick={() => voteHandler(index)}
                                >
                                   {player.type === 'national' && (
                                       <span className={`fi fis fi-${player.code?.toLowerCase()} shrink-0 text-3xl mr-1 mt-0 rounded-full shadow-xl`}></span>
                                   )}
                                    <div className="gap-2">
                                        <h3>{player.name}</h3>
                                        <span className="text-weak text-sm">{player.position} - {capitalize(player.team)}</span>
                                    </div>
                                    {(showResults) && (
                                        <span className="votesPercentage absolute right-4 top-1/2 -translate-y-1/2 text-weak text-sm font-bold">
                                            <AnimatedNumber value={percent} duration={1500} />%
                                        </span>
                                    )}
                                    <ProgressBar gridMode={isGrid} percentage={(showResults) ? percent : 0} />
                                </li>
                            )});
                        })()}
                    </ul>
                    <ul className="grid auto-rows-fr gap-2">
                         {potm && potm.players && (() => {
                            const percentages = getDistributedPercentages(potm.players);
                            const maxPercentage = Math.max(...percentages);

                             return potm.players.slice(Math.ceil(potm.players.length / 2)).map((player, index) => {
                                const actualIndex = index + Math.ceil(potm.players.length / 2);
                                const percent = percentages[actualIndex];
                                const isWinner = percent === maxPercentage;

                                return (
                                <li 
                                    key={actualIndex} 
                                    className={`flex items-center relative gap-2 px-3 py-4 transition-all duration-500 ${!hasVoted ? 'can-vote' : ''} ${showWinnerHighlight && !isWinner ? 'dimmed' : ''}`}
                                    onClick={() => voteHandler(actualIndex)}
                                >
                                    {player.type === 'national' && (
                                        <span className={`fi fis fi-${player.code?.toLowerCase()} shrink-0 text-3xl mr-1 mt-0 rounded-full shadow-xl`}></span>
                                    )}
                                    <div className="gap-2">
                                        <h3>{player.name}</h3>
                                        <span className="text-weak text-sm">{player.position} - {capitalize(player.team)}</span>
                                    </div>
                                     {(showResults) && (
                                        <span className="votesPercentage absolute right-4 top-1/2 -translate-y-1/2 text-weak text-sm font-bold">
                                            <AnimatedNumber value={percent} duration={1500} />%
                                        </span>
                                    )}
                                    <ProgressBar gridMode={isGrid} percentage={(showResults) ? percent : 0} />
                                </li>
                            )});
                        })()}
                    </ul>
                </div>
            ) : (
                <ul className="space-y-2 sm:space-y-3">
                    {potm && potm.players && (() => {
                        const percentages = getDistributedPercentages(potm.players);
                        const maxPercentage = Math.max(...percentages);

                        return potm.players.map((player, index) => {
                            const percent = percentages[index];
                            const isWinner = percent === maxPercentage;

                            return (
                            <li 
                                key={index} 
                                className={`relative flex items-center gap-2 px-3 py-3 transition-all duration-500 ${!hasVoted ? 'can-vote' : ''} ${showWinnerHighlight && !isWinner ? 'dimmed' : ''}`}
                                onClick={() => voteHandler(index)}
                            >
                                {player.type === 'national' && (
                                    <span className={`fi fis fi-${player.code?.toLowerCase()} shrink-0 text-2xl sm:text-3xl mr-1 mt-0 rounded-full shadow-xl`}></span>
                                )}
                                <div className="gap-2">
                                    <h3>{player.name}</h3>
                                    <span className="text-weak text-sm">{player.position} - {capitalize(player.team)}</span>
                                </div>
                                {(showResults) && (
                                    <span className="votesPercentage absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold">
                                        <AnimatedNumber value={percent} duration={1500} />%
                                    </span>
                                )}
                                <ProgressBar gridMode={isGrid} percentage={(showResults) ? percent : 0} />
                            </li>
                        )});
                    })()}
                </ul>
            )}

            
            <span 
                className={`absolute nbVotes text-xs left-1/2 -translate-x-1/2 bottom-3 transition-opacity duration-500`}
                style={{ opacity: showNbVotes ? 0.3 : 0 }}
            >
                {potm ? potm.totalVotes : 0} votes
            </span>
            <LoadingOverlay show={potm === null} />
        </div>
    );
}

export default App;
