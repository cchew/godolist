/**
 * Firebase service configuration and authentication functions
 * @module services/firebase
 */

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

/**
 * Firebase configuration object
 * @type {Object}
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

/** @type {FirebaseApp} */
let app
/** @type {Auth} */
let auth

/**
 * Initializes Firebase application
 */
export const initializeFirebase = () => {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
}

/**
 * Signs in user with Google authentication
 * @returns {Promise<Object>} User object
 * @throws {Error} If sign in fails
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return {
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      }
    }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

/**
 * Signs out the current user
 * @returns {Promise<void>}
 * @throws {Error} If sign out fails
 */
export const logoutUser = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

/**
 * Gets the current authenticated user
 * @returns {Promise<Object|null>} User object or null if not authenticated
 * @throws {Error} If getting user fails
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      if (user) {
        resolve({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        })
      } else {
        resolve(null)
      }
    }, reject)
  })
}