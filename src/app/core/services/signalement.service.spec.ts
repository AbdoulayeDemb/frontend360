import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { SignalementService } from './signalement.service';

describe('SignalementService', () => {
    let service: SignalementService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(SignalementService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('resolves a backend-relative photo path against the API origin', () => {
        let photoUrl: string | undefined;

        service.getById(42).subscribe(signalement => {
            photoUrl = signalement.photoAvantUrl;
        });

        httpTestingController.expectOne('http://localhost:8080/api/signalements/42').flush({
            idSignalement: 42,
            photoAvantUrl: '/uploads/signalement.jpg'
        });

        expect(photoUrl).toBe('http://localhost:8080/uploads/signalement.jpg');
    });

    it('keeps an absolute photo URL unchanged', () => {
        let photoUrl: string | undefined;

        service.getById(42).subscribe(signalement => {
            photoUrl = signalement.photoAvantUrl;
        });

        httpTestingController.expectOne('http://localhost:8080/api/signalements/42').flush({
            idSignalement: 42,
            photoAvantUrl: 'https://cdn.example.test/signalement.jpg'
        });

        expect(photoUrl).toBe('https://cdn.example.test/signalement.jpg');
    });

    it('maps the assigned agent identifier from the backend response', () => {
        let agentId: number | undefined;

        service.getById(42).subscribe(signalement => {
            agentId = signalement.idAgentAssigne;
        });

        httpTestingController.expectOne('http://localhost:8080/api/signalements/42').flush({
            idSignalement: 42,
            agentAssigneId: 17
        });

        expect(agentId).toBe(17);
    });
});
