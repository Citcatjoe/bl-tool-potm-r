import { db } from './firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';

export async function fetchPotmData(docRef) {
  try {
    const potmRef = doc(db, 'embeds', docRef); // Remplacez 'questions' par le nom de votre collection
    const docSnap = await getDoc(potmRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.error('No document found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching potm data:', error);
    throw error;
  }
}

// Incrémente le compteur de votes d'une carte Tinder via une transaction Firebase (par index)
// export async function updateTinderCardVotesTransactional(docId, cardIndex, direction) {
//   const tinderDocRef = doc(db, 'embeds', docId);
//   await runTransaction(db, async (transaction) => {
//     const tinderDoc = await transaction.get(tinderDocRef);
//     if (!tinderDoc.exists()) throw 'Document does not exist!';
//     const data = tinderDoc.data();
//     const votes = { ...data.tinderVotes } || {};
//     const voteEntry = votes[cardIndex] || { yes: 0, no: 0 };
//     if (direction === 'left') {
//       voteEntry.no = (voteEntry.no || 0) + 1;
//     } else if (direction === 'right') {
//       voteEntry.yes = (voteEntry.yes || 0) + 1;
//     }
//     votes[cardIndex] = voteEntry;
//     transaction.update(tinderDocRef, { tinderVotes: votes });
//   });
// }