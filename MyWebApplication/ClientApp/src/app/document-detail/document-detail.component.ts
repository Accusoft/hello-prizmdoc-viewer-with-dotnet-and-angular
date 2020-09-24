import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DocumentService } from '../document.service';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.css']
})
export class DocumentDetailComponent implements OnInit {
  filename: string;
  viewingSessionId: string;
  viewerControl: any;
  canInteract = false;
  error: Error;

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService
  ) {
    this.filename = this.route.snapshot.paramMap.get('filename');
  }

  ngOnInit(): void {
    // Create a viewing session for the document we want to view, then update
    // this.viewingSessionId. Setting a value for this.viewingSessionId will
    // send the value (via data binding in the HTML template) to the child
    // prizmdoc-viewer-wrapper component, causing it to initialize.
    this.documentService.createViewingSessionForDocument(this.filename)
      .pipe(catchError((err) => {
        this.error = err;
        return EMPTY;
      }))
      .subscribe((viewingSessionId: string) => {
        this.viewingSessionId = viewingSessionId;
      });
  }

  // Call this method to store a reference to the viewerControl so we can use its API.
  setViewerControl(viewerControl: any): void {
    // Store a reference to the viewerControl.
    this.viewerControl = viewerControl;

    // Update our "canInteract" variable whenever the viewer is fully ready. For
    // the full list of PCCViewer.EventType values you can subscribe to, see
    // https://help.accusoft.com/PrizmDoc/v13.13/HTML/PCCViewer.html#.EventType
    this.viewerControl.on((window as any).PCCViewer.EventType.ViewerReady, () => {
      this.canInteract = true;
    });
  }

  // Calls the viewerControl API to navigate to the next page.
  nextPage(): void {
    this.viewerControl.changeToNextPage();
  }

  // Calls the viewerControl API to navigate to the previous page.
  previousPage(): void {
    this.viewerControl.changeToPrevPage();
  }
}

