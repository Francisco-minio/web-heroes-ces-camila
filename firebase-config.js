// Configuración de Firebase (Opcional - para implementación en la nube)
// Descomenta y configura con tus credenciales de Firebase

/*
// Importar las funciones necesarias de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración de tu aplicación web de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_DOMINIO.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Funciones de Firebase para reemplazar LocalStorage

// Guardar héroe en Firestore
async function saveHeroToFirestore(heroData) {
    try {
        const docRef = await addDoc(collection(db, "heroes"), heroData);
        console.log("Héroe guardado con ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error al guardar héroe: ", error);
        throw error;
    }
}

// Obtener todos los héroes
async function getHeroesFromFirestore() {
    try {
        const heroesCollection = collection(db, "heroes");
        const heroSnapshot = await getDocs(heroesCollection);
        const heroesList = heroSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return heroesList;
    } catch (error) {
        console.error("Error al obtener héroes: ", error);
        throw error;
    }
}

// Actualizar héroe
async function updateHeroInFirestore(heroId, heroData) {
    try {
        const heroRef = doc(db, "heroes", heroId);
        await updateDoc(heroRef, heroData);
        console.log("Héroe actualizado exitosamente");
    } catch (error) {
        console.error("Error al actualizar héroe: ", error);
        throw error;
    }
}

// Eliminar héroe
async function deleteHeroFromFirestore(heroId) {
    try {
        const heroRef = doc(db, "heroes", heroId);
        await deleteDoc(heroRef);
        console.log("Héroe eliminado exitosamente");
    } catch (error) {
        console.error("Error al eliminar héroe: ", error);
        throw error;
    }
}

// Guardar historial de puntos
async function savePointsHistoryToFirestore(pointsData) {
    try {
        const docRef = await addDoc(collection(db, "pointsHistory"), pointsData);
        console.log("Historial de puntos guardado con ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error al guardar historial de puntos: ", error);
        throw error;
    }
}

// Obtener historial de puntos
async function getPointsHistoryFromFirestore() {
    try {
        const pointsCollection = collection(db, "pointsHistory");
        const q = query(pointsCollection, orderBy("date", "desc"));
        const pointsSnapshot = await getDocs(q);
        const pointsList = pointsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return pointsList;
    } catch (error) {
        console.error("Error al obtener historial de puntos: ", error);
        throw error;
    }
}

// Función para sincronizar datos locales con Firebase
async function syncWithFirebase() {
    try {
        // Sincronizar héroes
        const firebaseHeroes = await getHeroesFromFirestore();
        if (firebaseHeroes.length > 0) {
            heroes = firebaseHeroes;
            localStorage.setItem('superheroes_data', JSON.stringify({
                heroes,
                pointsHistory,
                availableAvatars,
                availableEmojis,
                rewards
            }));
        }
        
        // Sincronizar historial de puntos
        const firebasePointsHistory = await getPointsHistoryFromFirestore();
        if (firebasePointsHistory.length > 0) {
            pointsHistory = firebasePointsHistory;
            localStorage.setItem('superheroes_data', JSON.stringify({
                heroes,
                pointsHistory,
                availableAvatars,
                availableEmojis,
                rewards
            }));
        }
        
        console.log("Datos sincronizados exitosamente con Firebase");
        updateUI();
    } catch (error) {
        console.error("Error en sincronización con Firebase: ", error);
    }
}

// Exportar funciones para uso en el archivo principal
window.firebaseFunctions = {
    saveHeroToFirestore,
    getHeroesFromFirestore,
    updateHeroInFirestore,
    deleteHeroFromFirestore,
    savePointsHistoryToFirestore,
    getPointsHistoryFromFirestore,
    syncWithFirebase
};

/*
Instrucciones de configuración:
1. Ve a https://console.firebase.google.com
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Firestore Database en modo de prueba o producción
4. Copia tu configuración desde "Configuración del proyecto" > "General" > "Tus aplicaciones"
5. Reemplaza los valores en firebaseConfig arriba
6. Descomenta todo este archivo
7. Agrega el script en index.html antes de superheroes.js:
   <script type="module" src="firebase-config.js"></script>
8. Modifica las funciones de guardado en superheroes.js para usar Firebase
*/

console.log("Configuración de Firebase lista. Descomenta el código para activar la sincronización en la nube.");

/* Descomenta desde aquí para activar Firebase */