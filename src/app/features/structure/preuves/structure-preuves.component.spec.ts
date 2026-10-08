import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { EnumStatut, EnumTypeUrgence, EnumTypePreuve } from '../../../core/models/enums.model';
import { PreuveResolutionResponseDto } from '../../../core/models/preuve-resolution.model';
import { Signalement } from '../../../core/models/signalement.model';
import { AuthService } from '../../../core/services/auth.service';
import { PreuveService } from '../../../core/services/preuve.service';
import { SignalementService } from '../../../core/services/signalement.service';
import { StructurePreuvesComponent } from './structure-preuves.component';

describe('StructurePreuvesComponent', () => {
  let fixture: ComponentFixture<StructurePreuvesComponent>;
  let component: StructurePreuvesComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let preuveService: jasmine.SpyObj<PreuveService>;
  let signalementService: jasmine.SpyObj<SignalementService>;

  const preuve: PreuveResolutionResponseDto = {
    idPreuve: 7,
    idSignalement: 12,
    typePreuve: EnumTypePreuve.PHOTO_APRES,
    photoApresUrl: 'https://example.test/apres.jpg',
    rapportTexte: 'La fuite a été réparée.',
    dateResolution: '2026-10-08T09:00:00',
    prenomAgent: 'Moussa',
    nomAgent: 'Traoré',
    telephoneAgent: '70123456',
    matriculeAgent: 'AG-004'
  };

  const signalement: Signalement = {
    idSignalement: 12,
    codeTrackingUnique: 'ALT-12AB34CD',
    statut: EnumStatut.EN_COURS,
    typeUrgence: EnumTypeUrgence.MOYENNE,
    description: 'Une fuite d’eau dans la rue.',
    dateHeureAlerte: '2026-10-07T08:00:00',
    latitude: 12.6,
    longitude: -8.0,
    idCitoyen: 3,
    idCategorie: 2,
    nomCategorie: 'Fuite'
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getIdStructure']);
    preuveService = jasmine.createSpyObj<PreuveService>('PreuveService', ['obtenirToutesLesPreuves']);
    signalementService = jasmine.createSpyObj<SignalementService>(
      'SignalementService',
      ['getByStructure', 'changeStatut']
    );
    authService.getIdStructure.and.returnValue(4);
    preuveService.obtenirToutesLesPreuves.and.returnValue(of([preuve]));
    signalementService.getByStructure.and.returnValue(of([signalement]));
    signalementService.changeStatut.and.returnValue(of({
      ...signalement,
      statut: EnumStatut.RESOLU
    }));

    TestBed.configureTestingModule({
      imports: [StructurePreuvesComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: PreuveService, useValue: preuveService },
        { provide: SignalementService, useValue: signalementService },
        provideRouter([])
      ]
    });
    fixture = TestBed.createComponent(StructurePreuvesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and associates structure proofs with their signalements', () => {
    expect(preuveService.obtenirToutesLesPreuves).toHaveBeenCalled();
    expect(signalementService.getByStructure).toHaveBeenCalledWith(4);
    expect(component.preuves[0].signalement?.codeTrackingUnique).toBe('ALT-12AB34CD');
    expect(fixture.nativeElement.textContent).toContain('La fuite a été réparée.');
    expect(fixture.nativeElement.textContent).toContain('Moussa Traoré');
    expect(fixture.nativeElement.textContent).toContain('70123456');
    expect(fixture.nativeElement.textContent).toContain('AG-004');
  });

  it('confirms the resolution by changing the related signalement to resolved', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.confirmerResolution(component.preuves[0]);

    expect(signalementService.changeStatut).toHaveBeenCalledWith(12, EnumStatut.RESOLU);
    expect(component.preuves[0].signalement?.statut).toBe(EnumStatut.RESOLU);
    expect(component.actionMessage).toContain('est confirmée');
  });

  it('paginates proofs and resets to the first page when the filter changes', () => {
    component.preuves = Array.from({ length: 7 }, (_, index) => ({
      preuve: { ...preuve, idPreuve: index + 1 },
      signalement: { ...signalement, idSignalement: index + 1 }
    }));

    expect(component.preuvesPage.length).toBe(3);
    expect(component.nombrePages).toBe(3);

    component.allerALaPage(2);
    expect(component.preuvesPage.length).toBe(3);
    expect(component.debutAffichage).toBe(4);

    component.changerFiltre('a-confirmer');
    expect(component.pageActuelle).toBe(1);
    expect(component.preuvesPage.length).toBe(3);
    expect(component.debutAffichage).toBe(1);
  });
});
