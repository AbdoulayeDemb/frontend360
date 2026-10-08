import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { EnumTypePreuve } from '../models/enums.model';
import { PreuveService } from './preuve.service';

describe('PreuveService', () => {
  let service: PreuveService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PreuveService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('resolves relative after-photo paths against the backend origin', () => {
    let photoUrl: string | undefined;
    service.obtenirToutesLesPreuves().subscribe(preuves => {
      photoUrl = preuves[0].photoApresUrl;
    });

    httpTestingController.expectOne('http://localhost:8080/api/preuves').flush([{
      idPreuve: 7,
      idSignalement: 12,
      typePreuve: EnumTypePreuve.PHOTO_APRES,
      photoApresUrl: '/uploads/resolution.jpg',
      dateResolution: '2026-10-08T09:00:00'
    }]);

    expect(photoUrl).toBe('http://localhost:8080/uploads/resolution.jpg');
  });

  it('preserves absolute after-photo URLs', () => {
    let photoUrl: string | undefined;
    service.obtenirToutesLesPreuves().subscribe(preuves => {
      photoUrl = preuves[0].photoApresUrl;
    });

    httpTestingController.expectOne('http://localhost:8080/api/preuves').flush([{
      idPreuve: 7,
      idSignalement: 12,
      typePreuve: EnumTypePreuve.PHOTO_APRES,
      photoApresUrl: 'https://cdn.example.test/resolution.jpg',
      dateResolution: '2026-10-08T09:00:00'
    }]);

    expect(photoUrl).toBe('https://cdn.example.test/resolution.jpg');
  });
});
