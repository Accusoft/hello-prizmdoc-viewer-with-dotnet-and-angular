import { Component, OnInit } from '@angular/core';
import { DocumentService, } from './document.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'app';

  viewingSessionId: string;

  constructor(
    private documentService: DocumentService
  ) { }
}
