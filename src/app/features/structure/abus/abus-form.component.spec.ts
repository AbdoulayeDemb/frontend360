import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AbusService } from '../../../core/services/abus.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalementService } from '../../../core/services/signalement.service';
import { Signalement } from '../../../core/models/signalement.model';
import { EnumStatut, EnumTypeUrgence } from '../../../core/models/enums.model';
import { AbusFormComponent } from './abus-form.component';

describe('AbusFormComponent', () => {
  let fixture: ComponentFixture<AbusFormComponent>;
  let component: AbusFormComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let abusService: jasmine.SpyObj<AbusService>;
  let signalementService: jasmine.SpyObj<SignalementService>;
  let router: Router;

  const signalement: Signalement = {
    idSignalement: 8,
    codeTrackingUnique: 'ALT-8A2F9B1C',
    statut: EnumStatut.DECLARE,
    typeUrgence: EnumTypeUrgence.MOYENNE,
    description: 'Déchets abandonnés.',
    dateHeureAlerte: '2026-10-08T08:00:00',
    latitude: 12.6,
    longitude: -8,
    idCitoyen: 3,
    citoyenNomComplet: 'Moussa Traoré',
    idCategorie: 2,
    nomCategorie: 'Voirie'
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getIdStructure', 'isResponsableStructure'
    ]);
    abusService = jasmine.createSpyObj<AbusService>('AbusService', [
      'obtenirLesAbus', 'classerCommeAbus'
    ]);
    signalementService = jasmine.createSpyObj<SignalementService>(
      'SignalementService', ['getByStructure']
    );
    authService.getIdStructure.and.returnValue(3);
    authService.isResponsableStructure.and.returnValue(true);
    abusService.obtenirLesAbus.and.returnValue(of([]));
    abusService.classerCommeAbus.and.returnValue(of({
      idAbus: 1,
      idSignalement: 8,
      codeTrackingUnique: signalement.codeTrackingUnique,
      typeAbus: 'FAUSSE_INFORMATION',
      niveauGravite: 'MOYEN',
      justification: 'Le signalement est erroné.',
      statut: 'A_VERIFIER',
      dateClassement: '2026-10-08T10:00:00'
    }));
    signalementService.getByStructure.and.returnValue(of([signalement]));

    TestBed.configureTestingModule({
      imports: [AbusFormComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AbusService, useValue: abusService },
        { provide: SignalementService, useValue: signalementService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ idSignalement: '8' }) } }
        }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture = TestBed.createComponent(AbusFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the signalement and shows prefilled citizen and category', () => {
    expect(component.signalement?.idSignalement).toBe(8);
    const readOnlyInputs = fixture.nativeElement.querySelectorAll('.report-fields input') as NodeListOf<HTMLInputElement>;
    expect(readOnlyInputs[0].value).toBe('ALT-8A2F9B1C');
    expect(readOnlyInputs[1].value).toBe('Moussa Traoré');
    expect(readOnlyInputs[2].value).toBe('Voirie');
  });

  it('submits the selected classification and returns to the abuse list', () => {
    component.form.controls.justification.setValue('Le signalement est erroné.');
    component.soumettre();

    expect(abusService.classerCommeAbus).toHaveBeenCalledWith({
      idSignalement: 8,
      typeAbus: 'FAUSSE_INFORMATION',
      niveauGravite: 'MOYEN',
      justification: 'Le signalement est erroné.'
    }, null);
    expect(router.navigate).toHaveBeenCalledWith(['/structure/abus']);
  });

  it('requires and submits a custom abuse type when Other is selected', () => {
    component.form.controls.typeAbus.setValue('AUTRE');
    fixture.detectChanges();

    const customTypeInput = fixture.nativeElement.querySelector('.custom-abuse-type input') as HTMLInputElement;
    expect(customTypeInput).not.toBeNull();
    expect(component.form.controls.typeAbusPersonnalise.invalid).toBeTrue();

    component.form.controls.typeAbusPersonnalise.setValue('Usurpation de signalement');
    component.form.controls.justification.setValue('Les informations ont été usurpées.');
    component.soumettre();

    expect(abusService.classerCommeAbus).toHaveBeenCalledWith({
      idSignalement: 8,
      typeAbus: 'AUTRE',
      typeAbusPersonnalise: 'Usurpation de signalement',
      niveauGravite: 'MOYEN',
      justification: 'Les informations ont été usurpées.'
    }, null);
  });

  it('prevents classifying a resolved signalement as an abuse', () => {
    component.signalement = { ...signalement, statut: EnumStatut.RESOLU };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('ne peut pas être classé comme abus');
    component.soumettre();
    expect(abusService.classerCommeAbus).not.toHaveBeenCalled();
  });

  it('prevents classifying a signalement already assigned to an agent as an abuse', () => {
    component.signalement = {
      ...signalement,
      idAgentAssigne: 7
    };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('ne peut pas être classé comme abus');
    component.soumettre();
    expect(abusService.classerCommeAbus).not.toHaveBeenCalled();
  });
});
