import { Component, OnInit } from '@angular/core';
import { DocumentService } from '../document.service';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit {
  filenames: string[];
  error: any;

  constructor(
    private documentService: DocumentService
  ) { }

  ngOnInit(): void {
    this.documentService.getDocuments()
      .pipe(catchError((err) => {
        this.error = err;
        return EMPTY;
      }))
      .subscribe(filenames => {
        this.filenames = filenames
      });
  }

}
