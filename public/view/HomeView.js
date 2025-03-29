import { AbstractView } from "./AbstractView.js";
import { currentUser } from "../controller/firebase_auth.js";

export class HomeView extends AbstractView {
    controiller = null;
    constructor(controller) {
        super();
        this.controller = controller;
    }
    async onMount() {
        if (!currentUser) {
            this.parentElement.innerHTML = '<h1> Access Denied </h1>';
            return;
        }
        await this.controller.onLoadPhotoNoteList();
        console.log('HomeView.onMount() called', this.controller.model.photoNoteList);
    }
    async updateView() {
        console.log('HomeView.updateView() is called');
        const viewWrapper = document.createElement('div');
        const response = await fetch('/view/templates/home.html', { cache: 'no-store' });
        viewWrapper.innerHTML = await response.text();

        const view = this.renderPhotoNoteList();
        viewWrapper.appendChild(view);

        return viewWrapper;
    }

    renderPhotoNoteList() {
        const list = document.createElement('div');
        list.id = 'photoNoteList';
        list.className = 'row row-cols-1 row-cols-md-3 row-cols-lg-3 g-4';
        if (this.controller.model.photoNoteList.length === 0) {
            const noData = document.createElement('div');
            noData.innerHTML = '<h5>Photo Notes Not Found</h5>';
            list.appendChild(noData);
        } else {
            for (const photoNote of this.controller.model.photoNoteList) {
                const card = this.createCard(photoNote);
                list.appendChild(card);
            }
        }
        return list;
    }

    createCard(photoNote) {
        const card = document.createElement('div');
        // card.classList.add('col');
        card.className = 'col';
        card.innerHTML = `
        <div id=${photoNote.docId} class="card card-photonote" style="width: 18rem;">
        <img src="${photoNote.imageURL}" class="card-img-top" alt="...">
        <div class="card-body">
            <h5 class="card-title">${photoNote.caption}</h5>
            <p class="card-text">${photoNote.description || 'no description'}</p>
        </div>
        <div class="card-footer">
            <p class="card-text">SharedWith [
            ${photoNote.sharedWith.length > 0 ? photoNote.sharedWith.join(';') : 'Not shared '}
            ]</p>
            <small class="text-muted">Date: ${new Date(photoNote.timestamp).toLocaleString()}</small>
        </div>
        </div>
        `;
        return card;
    }

    attachEvents() {
        document.getElementById('image-file').onchange = this.controller.onChangeImageFile;
        document.forms.formAddNew.onsubmit = this.controller.onSubmitAddNew;
        document.querySelectorAll('.card-photonote').forEach(card => {
            card.onclick = this.controller.onClickCard;
            card.oncontextmenu= this.controller.onRightClickCard;
        });
    }
    async onLeave() {
        if (!currentUser) {
            this.parentElement.innerHTML = '<h1> Access Denied </h1>';
            return
        }

        console.log('HomeView.onLeave() is called');
    }
}
