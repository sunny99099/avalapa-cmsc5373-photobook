import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js"

import { app } from './firebase_core.js';
import { currentUser } from "./firebase_auth.js";

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

const IMAGE_FOLDER = 'image_folder';

export async function uploadImageToCloudStorage(imageFile) {
    let imageName = '' + Date.now() + Math.random();
    imageName = imageName.replace('.', '-');
    const imagePath = `${IMAGE_FOLDER}/${currentUser.uid}/${imageName}`;
    const storageRef = ref(storage, imagePath);
    const snapShot = await uploadBytes(storageRef, imageFile);
    const imageURL = await getDownloadURL(snapShot.ref);
    return { imageName, imageURL };
}

export async function deleteImageFromCloudStorage(imageName) {
    const imagePath = `${IMAGE_FOLDER}/${currentUser.uid}/${imageName}`;
    const fileRef = ref(storage, imagePath);
    await deleteObject(fileRef);
}