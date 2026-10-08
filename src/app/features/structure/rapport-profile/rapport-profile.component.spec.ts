import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AgentStructureResponseDto } from '../../../core/models/agent-structure.model';
import { EnumRole } from '../../../core/models/enums.model';
import { Utilisateur } from '../../../core/models/utilisateur.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { RapportProfileComponent } from './rapport-profile.component';

describe('RapportProfileComponent', () => {
  let fixture: ComponentFixture<RapportProfileComponent>;
  let component: RapportProfileComponent;
  let agentService: jasmine.SpyObj<AgentService>;
  let authService: jasmine.SpyObj<AuthService>;

  const user: Utilisateur = {
    idUtilisateur: 12,
    nom: 'Diallo',
    prenom: 'Aminata',
    telephone: '770000000',
    email: 'aminata@example.test',
    quartier: 'Plateau',
    role: EnumRole.STRUCTURE,
    estActif: true,
    estResponsable: false
  };

  const agent: AgentStructureResponseDto = {
    idUtilisateur: 12,
    nom: 'Diallo',
    prenom: 'Aminata',
    telephone: '770000000',
    email: 'aminata@example.test',
    matriculeAgent: 'AG-012',
    estResponsable: false,
    role: EnumRole.STRUCTURE,
    estActif: true,
    dateCreation: '2026-01-01',
    idStructure: 4,
    nomStructure: 'Service communal'
  };

  beforeEach(() => {
    agentService = jasmine.createSpyObj<AgentService>('AgentService', [
      'obtenirAgentParId',
      'modifierAgent'
    ]);
    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['mettreAJourUtilisateur'],
      { currentUserValue: user }
    );
    agentService.obtenirAgentParId.and.returnValue(of(agent));
    agentService.modifierAgent.and.returnValue(of(agent));

    TestBed.configureTestingModule({
      imports: [RapportProfileComponent],
      providers: [
        { provide: AgentService, useValue: agentService },
        { provide: AuthService, useValue: authService },
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(RapportProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the authenticated agent profile without displaying neighborhood', () => {
    expect(agentService.obtenirAgentParId).toHaveBeenCalledWith(user.idUtilisateur);
    expect(component.isProfileLoaded).toBeTrue();
    expect(component.profileForm.controls.matriculeAgent.value).toBe('AG-012');
    expect(fixture.nativeElement.textContent).not.toContain('Quartier');
  });

  it('updates profile fields through the existing agent API and refreshes the authenticated user', () => {
    agentService.modifierAgent.and.returnValue(of({
      ...agent,
      nom: 'Nouveau nom',
      prenom: 'Nouveau prénom',
      telephone: '771112233',
      email: 'nouveau@example.test'
    }));
    component.profileForm.setValue({
      nom: 'Nouveau nom',
      prenom: 'Nouveau prénom',
      telephone: '771112233',
      email: 'nouveau@example.test',
      matriculeAgent: 'AG-012'
    });

    component.enregistrer();

    expect(agentService.modifierAgent).toHaveBeenCalledWith(12, {
      nom: 'Nouveau nom',
      prenom: 'Nouveau prénom',
      telephone: '771112233',
      email: 'nouveau@example.test',
      matriculeAgent: 'AG-012'
    });
    expect(authService.mettreAJourUtilisateur).toHaveBeenCalledWith(jasmine.objectContaining({
      nom: 'Nouveau nom',
      prenom: 'Nouveau prénom',
      telephone: '771112233',
      matriculeAgent: 'AG-012'
    }));
    expect(component.successMessage).toBe('Vos informations ont été enregistrées.');
  });
});
