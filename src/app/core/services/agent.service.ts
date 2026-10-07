import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
	AgentStructureRequestDto,
	AgentStructureResponseDto,
	AgentStructureUpdateDto
} from '../models/agent-structure.model';

@Injectable({
	providedIn: 'root'
})
export class AgentService {
	private readonly apiUrl = 'http://localhost:8080/api/agents';

	constructor(private readonly http: HttpClient) {}

	obtenirAgentsParStructure(idStructure: number): Observable<AgentStructureResponseDto[]> {
		return this.http.get<AgentStructureResponseDto[]>(
			`${this.apiUrl}/structure/${idStructure}`
		);
	}

	obtenirAgentParId(idUtilisateur: number): Observable<AgentStructureResponseDto> {
		return this.http.get<AgentStructureResponseDto>(
			`${this.apiUrl}/${idUtilisateur}`
		);
	}

	creerAgent(idStructure: number, dto: AgentStructureRequestDto): Observable<AgentStructureResponseDto> {
		return this.http.post<AgentStructureResponseDto>(
			`${this.apiUrl}/structure/${idStructure}`,
			dto
		);
	}

	modifierAgent(idUtilisateur: number, dto: AgentStructureUpdateDto): Observable<AgentStructureResponseDto> {
		return this.http.put<AgentStructureResponseDto>(
			`${this.apiUrl}/${idUtilisateur}`,
			dto
		);
	}

	supprimerAgent(idUtilisateur: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${idUtilisateur}`);
	}
}
