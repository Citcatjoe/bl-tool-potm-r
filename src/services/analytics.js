import { db } from './firebase';
import { doc, updateDoc, increment, getDoc, runTransaction, getFirestore } from 'firebase/firestore';

/**
 * Envoie un événement au dataLayer pour un clic sur un lien global.
 * @param {string} docId - L'ID du document Firestore.
 */
export function dataLayerPushView(potmDoc) {
  const iframeId = `storytelling_POTM_${potmDoc}`;
  if (window.blickDataLayer) {
    window.blickDataLayer.push({
      event: 'iframe_impression',
      iframe_name: iframeId,
      iframe_id: 'iframe_impression',
    });
    
  } else {
  }
}



/**
 * Incrémente le compteur de vues dans Firebase pour un document donné de manière atomique.
 * @param {string} docId - L'ID du document Firestore.
 */ 
export async function incrementCounterViews(docId) {
  const db = getFirestore();
  const ref = doc(db, 'embeds', docId);
  try {
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(ref);
      if (!docSnap.exists()) return;
      const current = docSnap.data().counterViews || 0;
      transaction.update(ref, { counterViews: current + 1 });
    });
  } catch (e) {
    console.error('Erreur incrémentation counterViews:', e);
  }
}