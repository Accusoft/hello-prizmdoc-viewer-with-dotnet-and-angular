import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.get(DocumentService);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDocuments', () => {
    it('should return the expected set of documents', () => {
      const mockDocuments = [
        'one.pdf',
        'two.docx',
        'three.tiff'
      ];

      service.getDocuments().subscribe(filenames => {
        expect(filenames).toEqual(mockDocuments);
      });

      const req = httpMock.expectOne('/documents');
      expect(req.request.method).toBe('GET');
      req.flush(mockDocuments);
    })
  });

  describe('createViewingSessionForDocument', () => {
    it('should return a viewing session id when given a known filename', () => {
      const mockViewingSessionId = 'wat123';

      service.createViewingSessionForDocument('example.pdf').subscribe(viewingSessionId => {
        expect(viewingSessionId).toEqual(mockViewingSessionId);
      });

      const req = httpMock.expectOne('/documents/example.pdf/beginViewing');
      expect(req.request.method).toBe('POST');
      req.flush({viewingSessionId: mockViewingSessionId});
    })
  });
});
