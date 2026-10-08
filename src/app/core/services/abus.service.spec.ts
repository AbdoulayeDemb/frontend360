import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { AbusService } from './abus.service';

describe('AbusService', () => {
  let service: AbusService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AbusService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('loads abuses and resolves evidence URLs against the backend origin', () => {
    let pieceJointeUrl: string | undefined;
    service.obtenirLesAbus().subscribe(items => {
      pieceJointeUrl = items[0].pieceJointeUrl;
    });

    httpTestingController.expectOne('http://localhost:8080/api/abus').flush([{
      idAbus: 4,
      idSignalement: 8,
      codeTrackingUnique: 'ALT-8A2F9B1C',
      typeAbus: 'FAUSSE_INFORMATION',
      niveauGravite: 'MOYEN',
      justification: 'Informations non vérifiées',
      statut: 'A_VERIFIER',
      pieceJointeUrl: '/uploads/abus/preuve.pdf',
      dateClassement: '2026-10-08T10:00:00'
    }]);

    expect(pieceJointeUrl).toBe('http://localhost:8080/uploads/abus/preuve.pdf');
  });

  it('sends the abuse form and optional file as multipart data', () => {
    service.classerCommeAbus({
      idSignalement: 8,
      typeAbus: 'FAUSSE_INFORMATION',
      niveauGravite: 'MOYEN',
      justification: 'Informations non vérifiées'
    }, null).subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/api/abus');
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    const formData = request.request.body as FormData;
    expect(formData.has('abus')).toBeTrue();
    expect(formData.has('pieceJointe')).toBeFalse();
    request.flush({});
  });
});
