import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
    Signalement,
    SignalementCreateDto,
    AssignationSignalementDto
} from '../models/signalement.model';

import { EnumStatut } from '../models/enums.model';

@Injectable({
    providedIn: 'root'
})
export class SignalementService {

    private readonly http = inject(HttpClient);

    private readonly API_URL =
        'http://localhost:8080/api/signalements';

    /**
     * Récupérer tous les signalements.
     *
     * GET /api/signalements
     */
    getAll(): Observable<Signalement[]> {
        return this.http
            .get<any[]>(this.API_URL)
            .pipe(
                map(signalements =>
                    signalements.map(signalement =>
                        this.mapSignalement(signalement)
                    )
                )
            );
    }

    /**
     * Récupérer un signalement par son identifiant.
     *
     * GET /api/signalements/{idSignalement}
     */
    getById(idSignalement: number): Observable<Signalement> {
        return this.http
            .get<any>(`${this.API_URL}/${idSignalement}`)
            .pipe(
                map(signalement =>
                    this.mapSignalement(signalement)
                )
            );
    }

    /**
     * Récupérer les signalements d'un citoyen.
     *
     * GET /api/signalements/citoyen/{idCitoyen}
     */
    getByCitoyen(idCitoyen: number): Observable<Signalement[]> {
        return this.http
            .get<any[]>(
                `${this.API_URL}/citoyen/${idCitoyen}`
            )
            .pipe(
                map(signalements =>
                    signalements.map(signalement =>
                        this.mapSignalement(signalement)
                    )
                )
            );
    }

    /**
     * Récupérer les signalements d'une structure.
     *
     * GET /api/signalements/structure/{idStructure}
     */
    getByStructure(idStructure: number): Observable<Signalement[]> {
        return this.http
            .get<any[]>(
                `${this.API_URL}/structure/${idStructure}`
            )
            .pipe(
                map(signalements =>
                    signalements.map(signalement =>
                        this.mapSignalement(signalement)
                    )
                )
            );
    }

    /**
     * Récupérer les signalements d'un agent.
     *
     * GET /api/signalements/agent/{idAgent}
     */
    getByAgent(idAgent: number): Observable<Signalement[]> {
        return this.http
            .get<any[]>(
                `${this.API_URL}/agent/${idAgent}`
            )
            .pipe(
                map(signalements =>
                    signalements.map(signalement =>
                        this.mapSignalement(signalement)
                    )
                )
            );
    }

    /**
     * Récupérer les signalements selon leur statut.
     *
     * GET /api/signalements/statut/{statut}
     */
    getByStatut(statut: EnumStatut): Observable<Signalement[]> {
        return this.http
            .get<any[]>(
                `${this.API_URL}/statut/${statut}`
            )
            .pipe(
                map(signalements =>
                    signalements.map(signalement =>
                        this.mapSignalement(signalement)
                    )
                )
            );
    }

    /**
     * Créer un nouveau signalement.
     *
     * POST /api/signalements
     */
    create(data: SignalementCreateDto): Observable<Signalement> {
        return this.http
            .post<any>(this.API_URL, data)
            .pipe(
                map(signalement =>
                    this.mapSignalement(signalement)
                )
            );
    }

    /**
     * Modifier un signalement.
     *
     * PUT /api/signalements/{idSignalement}
     */
    update(
        idSignalement: number,
        data: SignalementCreateDto
    ): Observable<Signalement> {
        return this.http
            .put<any>(
                `${this.API_URL}/${idSignalement}`,
                data
            )
            .pipe(
                map(signalement =>
                    this.mapSignalement(signalement)
                )
            );
    }

    /**
     * Modifier le statut d'un signalement.
     *
     * PATCH /api/signalements/{idSignalement}/statut?statut=...
     */
    changeStatut(
        idSignalement: number,
        statut: EnumStatut
    ): Observable<Signalement> {
        return this.http
            .patch<any>(
                `${this.API_URL}/${idSignalement}/statut`,
                null,
                {
                    params: {
                        statut: statut
                    }
                }
            )
            .pipe(
                map(signalement =>
                    this.mapSignalement(signalement)
                )
            );
    }

    /**
     * Assigner un signalement à une structure.
     *
     * PATCH /api/signalements/{idSignalement}/assigner?idStructure=...
     */
    assignerStructure(
        idSignalement: number,
        idStructure: number
    ): Observable<Signalement> {
        return this.http
            .patch<any>(
                `${this.API_URL}/${idSignalement}/assigner`,
                null,
                {
                    params: {
                        idStructure: idStructure
                    }
                }
            )
            .pipe(
                map(signalement =>
                    this.mapSignalement(signalement)
                )
            );
    }

    /**
     * Assigner un signalement à un agent.
     *
     * PATCH /api/signalements/{idSignalement}/assigner-agent
     *
     * Body :
     * {
     *   "idAgent": 123
     * }
     */
    assignerAgent(
        idSignalement: number,
        data: AssignationSignalementDto
    ): Observable<Signalement> {
        return this.http
            .patch<any>(
                `${this.API_URL}/${idSignalement}/assigner-agent`,
                data
            )
            .pipe(
                map(signalement =>
                    this.mapSignalement(signalement)
                )
            );
    }

    /**
     * Supprimer un signalement.
     *
     * DELETE /api/signalements/{idSignalement}
     */
    delete(idSignalement: number): Observable<void> {
        return this.http.delete<void>(
            `${this.API_URL}/${idSignalement}`
        );
    }

    /**
     * Transformation du DTO backend vers le modèle Angular.
     *
     * Backend :
     * latitudeGPS
     * longitudeGPS
     * citoyenId
     * citoyenNomComplet
     * categorieId
     * categorieNom
     * structureAssigneeId
     * structureAssigneeNom
     *
     * Angular :
     * latitude
     * longitude
     * idCitoyen
     * citoyenNomComplet
     * idCategorie
     * nomCategorie
     * idStructureAssignee
     * nomStructureAssignee
     */
    private mapSignalement(data: any): Signalement {
        return {
            idSignalement: data.idSignalement,
            codeTrackingUnique: data.codeTrackingUnique,

            typeUrgence: data.typeUrgence,
            statut: data.statut,

            description: data.description,

            photoAvantUrl: data.photoAvantUrl,
            audioUrl: data.audioUrl,
            repereVisuel: data.repereVisuel,

            dateHeureAlerte: data.dateHeureAlerte,

            latitude: data.latitudeGPS,
            longitude: data.longitudeGPS,

            idCitoyen: data.citoyenId,
            citoyenNomComplet: data.citoyenNomComplet,

            idCategorie: data.categorieId,
            nomCategorie: data.categorieNom,

            idStructureAssignee: data.structureAssigneeId,
            nomStructureAssignee: data.structureAssigneeNom
        };
    }
}