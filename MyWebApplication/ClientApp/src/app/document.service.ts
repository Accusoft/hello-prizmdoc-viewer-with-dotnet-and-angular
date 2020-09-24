import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor(private httpClient: HttpClient) { }

  // Gets a list of available documents from the ASP.NET application server. In
  // this sample, the ASP.NET application server just returns a simple list of
  // static filenames. In a real application, your API may return something
  // different, such as database ids with associated document metadata. And your
  // real application API would only return documents which your user has access
  // to.
  getDocuments(): Observable<string[]> {
    return this.httpClient.get('/documents', { responseType: 'json' }) as Observable<string[]>;
  }

  // Asks the ASP.NET application server to create a viewing session for a
  // particular document. In this sample, documents are identified by a
  // filename. In a real application, you might use something else, such as a
  // database identifier, to identify your documents. The application server
  // will then make a request to the PrizmDoc Viewer backend to create a new
  // viewing session for the specified document, returning a new
  // viewingSessionId. This viewingSessionId is what your Angular app needs in
  // order to instantiate the viewer.
  createViewingSessionForDocument(filename: string): Observable<string> {
    return this.httpClient.post(`/documents/${filename}/beginViewing`, { responseType: 'json' })
      .pipe(pluck('viewingSessionId'));
  }
}
