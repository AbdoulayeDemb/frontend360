import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AbusResponseDto } from '../../../core/models/abus.model';
import { AbusService } from '../../../core/services/abus.service';
import { AuthService } from '../../../core/services/auth.service';
import { AbusComponent } from './abus.component';

describe('AbusComponent', () => {
  let fixture: ComponentFixture<AbusComponent>;
  let component: AbusComponent;
  let abusService: jasmine.SpyObj<AbusService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const makeAbus = (id: number, statut: 'A_VERIFIER' | 'CONFIRME' = 'A_VERIFIER'): AbusResponseDto => ({
    idAbus: id,
    idSignalement: id + 10,
    codeTrackingUnique: `ALT-${id}`,
    typeAbus: 'FAUSSE_INFORMATION',
    niveauGravite: 'MOYEN',
    justification: 'Vérification nécessaire.',
    statut,
    dateClassement: '2026-10-08T10:00:00'
  });

  beforeEach(() => {
    abusService = jasmine.createSpyObj<AbusService>('AbusService', [
      'obtenirLesAbus', 'changerStatut', 'telechargerPieceJointe'
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isResponsableStructure']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService.isResponsableStructure.and.returnValue(true);
    abusService.obtenirLesAbus.and.returnValue(of([makeAbus(1), makeAbus(2, 'CONFIRME')]));
    abusService.changerStatut.and.returnValue(of(makeAbus(1, 'CONFIRME')));

    TestBed.configureTestingModule({
      imports: [AbusComponent],
      providers: [
        { provide: AbusService, useValue: abusService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
    fixture = TestBed.createComponent(AbusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads abuses and filters by review status and search text', () => {
    expect(component.abus.length).toBe(2);
    expect(component.nombreAverifier).toBe(1);
    expect(component.nombreConfirmes).toBe(1);

    component.setFiltre('A_VERIFIER');
    expect(component.abusVisibles.map(item => item.idAbus)).toEqual([1]);
    component.recherche = 'ALT-2';
    expect(component.abusVisibles).toEqual([]);
  });

  it('opens the related report from the abuse list', () => {
    component.voirSignalement(makeAbus(1));
    expect(router.navigate).toHaveBeenCalledWith(['/structure/signalements', 11]);
  });

  it('uses the custom type label for an abuse classified as Other', () => {
    expect(component.labelType('AUTRE', 'Usurpation de signalement')).toBe('Usurpation de signalement');
  });
});
