export class HomeModel {
    photoNoteList;
    imageFile;
    constructor() {
        this.photoNoteList = [];
        this.imageFile = null
    }

    setPhotoNoteList(photoNoteList) {
        this.photoNoteList = photoNoteList;
    }

    prependPhotoNoteList(photoNote) {
        this.photoNoteList.unshift(photoNote);
    }

    getPhotoNoteByDocId(docId) {
        return this.photoNoteList.find(photoNote => photoNote.docId === docId);
    }

    updatePhotoNoteList(photoNote, update) {
        Object.assign(photoNote, update);
    }

    orderPhotoNoteListByTimestamp() {
        this.photoNoteList.sort((a, b) => b.timestamp - a.timestamp);
    }

    removePhotoNoteByDocId(docId) {
        const index = this.photoNoteList.findIndex(photoNote => photoNote.docId === docId);
        if (index >= 0) {
            this.photoNoteList.splice(index, 1);
        } else {
            console.error('removePhotoNoteByDocId: photoNote not found', docId);
        }
    }
}