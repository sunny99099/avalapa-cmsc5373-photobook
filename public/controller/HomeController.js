import { HomeModel } from '../model/HomeModel.js';
import { uploadImageToCloudStorage, deleteImageFromCloudStorage } from './cloudstorage_controller.js';
import { currentUser } from './firebase_auth.js';
import { PhotoNote } from '../model/PhotoNode.js';
import { addPhotoNoteToFirestore, getPhotoNoteListFromFirestore, updatePhotoNoteInFirestore, deletePhotoNoteFromFirestore } from './firestore_controller.js';
import { startspinner, stopspinner } from '../view/util.js';

export class HomeController {
    model = null;
    view = null;
    constructor() {
        this.model = new HomeModel();
        this.onChangeImageFile = this.onChangeImageFile.bind(this);
        this.onSubmitAddNew = this.onSubmitAddNew.bind(this);
        this.onClickCard = this.onClickCard.bind(this);
        this.onRightClickCard = this.onRightClickCard.bind(this);
    }
    setView(view) {
        this.view = view;
    }

    async onSubmitAddNew(e) {
        e.preventDefault();
        const r = PhotoNote.validateSharedWith(e.target.sharedWith.value);
        if (r != '') {
            alert(`ShareWith: Invalid email address: ${r}`);
            return;
        }
        startspinner();
        let imageName, imageURL;
        try {
            const r = await uploadImageToCloudStorage(this.model.imageFile);
            imageName = r.imageName;
            imageURL = r.imageURL;
        } catch (e) {
            stopspinner
            console.error(e)
            alert('Error uploading image');
            return;
        }
        const form = e.target;
        const caption = form.caption.value;
        const description = form.description.value;
        const sharedWith = PhotoNote.parseSharedWith(form.sharedWith.value);
        const uid = currentUser.uid;
        const createdBy = currentUser.email;
        const timestamp = Date.now();

        const photoNote = new PhotoNote({
            caption,
            description,
            uid,
            createdBy,
            imageName,
            imageURL,
            timestamp,
            sharedWith
        });


        try {
            const docId = await addPhotoNoteToFirestore(photoNote);
            photoNote.set_docId(docId);
            document.querySelector('button.btn-close').click();
            stopspinner();
        } catch (e) {
            stopspinner();
            console.error(e);
            alert('Error adding photo note to Firestore');
            return;
        }

        this.model.prependPhotoNoteList(photoNote);
        this.view.render();

    }

    onChangeImageFile(e) {
        const imgPreview = document.getElementById('image-preview');
        this.model.imageFile = e.target.files[0];
        if (!this.model.imageFile) {
            imgPreview.src = '';
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(this.model.imageFile);
        reader.onload = function () {
            imgPreview.src = reader.result;
        }

    }

    async onLoadPhotoNoteList() {
        startspinner();
        try {
            const photoNoteList = await getPhotoNoteListFromFirestore(currentUser.uid);
            this.model.setPhotoNoteList(photoNoteList);
            stopspinner();
        } catch (e) {
            stopspinner();
            console.error(e);
            this.model.setPhotoNoteList([]);
            alert('Error loading photo notes');
        }
    }

    onClickCard(e) {
        const card = e.currentTarget; // element where the event listener is attached
        const docId = card.id;
        console.log('onClickCard', docId);
        const photoNote = this.model.getPhotoNoteByDocId(docId);
        if (!photoNote) {
            console.error('onClickCard: photoNote not found', docId);
            return;
        }

        // display photoNote in the edit modal
        const form = document.forms.formEdit;
        form.caption.value = photoNote.caption;
        form.description.value = photoNote.description;
        form.sharedWith.value = photoNote.sharedWith.join(';');
        const img = form.querySelector('img');
        img.src = photoNote.imageURL;
        form.onsubmit = function (e) {
            e.preventDefault();
            this.onSubmitEditForm(e, photoNote);
        }.bind(this);

        // display the modal
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-edit'));
        modal.show();
    }

    async onSubmitEditForm(e, photoNote) {
        const form = document.forms.formEdit;
        // validate sharedWith
        const r = PhotoNote.validateSharedWith(form.sharedWith.value);
        if (r != '') {
            alert(`ShareWith: Invalid email address: ${r}`);
            return;
        }
        const caption = form.caption.value;
        const description = form.description.value;
        const sharedWith = PhotoNote.parseSharedWith(form.sharedWith.value);
        // verify if any changes were made
        if (caption == photoNote.caption && description == photoNote.description && sharedWith.sort().join(';') == photoNote.sharedWith.sort().join(';')) {
            // no change => dimiss the modal
            console.log('no change');
            const b = document.getElementById('modal-edit-close-button');
            b.click();
            return;
        }

        const update = {
            caption, description, sharedWith,
            timestamp: Date.now()
        };
        startspinner();
        try {
            await updatePhotoNoteInFirestore(photoNote.docId, update);
            this.model.updatePhotoNoteList(photoNote, update);
            this.model.orderPhotoNoteListByTimestamp();
            stopspinner();
            // dismiss the modal
            const b = document.getElementById('modal-edit-close-button');
            b.click();
            this.view.render();
        } catch (e) {
            stopspinner();
            console.error(e);
            alert('Error updating photo note');
            return;
        }
    }

    async onRightClickCard(e) {
        e.preventDefault(); // prevent the context menu from appearing
        const card = e.currentTarget; // element where the event listener is attached
        const docId = card.id;
        const photoNote = this.model.getPhotoNoteByDocId(docId);
        if (!photoNote) {
            console.error('onRightClickCard: photoNote not found', docId);
            return;
        }
        // confirm delete
        if (!confirm('Delete this photo note?')) {
            return; // cancel delete
        }
        startspinner();
        try {
            await deletePhotoNoteFromFirestore(photoNote.docId);
            this.model.removePhotoNoteByDocId(photoNote.docId);
            await deleteImageFromCloudStorage(photoNote.imageName);
            stopspinner();
            this.view.render();
        } catch (e) {
            stopspinner();
            console.error(e);
            alert('Error deleting photo note');
            return;
        }
    }
}