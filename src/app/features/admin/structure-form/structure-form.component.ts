
import {
    AfterViewInit,
    Component,
    OnDestroy,
    OnInit,
    inject,
    ViewChild,
    ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import {
    ActivatedRoute,
    Router
} from '@angular/router';

import * as L from 'leaflet';
import 'leaflet-draw';

import { StructureService } from '../../../core/services/structure.service';

import {
    StructureCompetenteRequestDto,
    StructureCompetenteResponseDto
} from '../../../core/models/structure-competente.model';

import { EnumTypeStructure } from '../../../core/models/enums.model';


@Component({
    selector: 'app-structure-form',
    standalone: true,

    imports: [
        CommonModule,
        ReactiveFormsModule
    ],

    templateUrl: './structure-form.component.html',
    styleUrl: './structure-form.component.css'
})
export class StructureFormComponent
    implements OnInit, AfterViewInit, OnDestroy {

    private readonly fb = inject(FormBuilder);
    private readonly structureService = inject(StructureService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    @ViewChild('mapContainer')
    mapContainer!: ElementRef<HTMLDivElement>;

    readonly EnumTypeStructure = EnumTypeStructure;

    structureForm!: FormGroup;

    structureId: number | null = null;

    isEditMode = false;
    isLoading = false;
    isSubmitting = false;

    errorMessage = '';
    successMessage = '';

    // ==========================================
    // NOTIFICATION DE SUCCÈS
    // ==========================================

    notificationVisible = false;

    notificationTitre = '';

    notificationMessage = '';

    // ==========================================
    // CARTE LEAFLET
    // ==========================================

    private map!: L.Map;

    private drawnItems!: L.FeatureGroup;

    private currentPolygon: L.Polygon | null = null;

    private mapInitialized = false;

    // ==========================================
    // TYPES DE STRUCTURES
    // ==========================================

    readonly typesStructures = [

        {
            value: EnumTypeStructure.MAIRIE,
            label: 'Mairie'
        },

        {
            value: EnumTypeStructure.EDM_SA,
            label: 'EDM-SA'
        },

        {
            value: EnumTypeStructure.SAPEURS_POMPIERS,
            label: 'Sapeurs-pompiers'
        },

        {
            value: EnumTypeStructure.SOMAGEP,
            label: 'SOMAGEP'
        },

        {
            value: EnumTypeStructure.GIE,
            label: 'GIE'
        },

        {
            value: EnumTypeStructure.POLICE,
            label: 'Police'
        }

    ];

    // ==========================================
    // INITIALISATION
    // ==========================================

    ngOnInit(): void {
        this.initialiserForm();
        this.detecterMode();
    }

    ngAfterViewInit(): void {

        /*
         * Initialisation de la carte après
         * le rendu du conteneur HTML.
         */
        setTimeout(() => {

            this.initialiserCarte();

        });

    }

    ngOnDestroy(): void {

        if (this.map) {
            this.map.remove();
        }

    }

    // ==========================================
    // INITIALISATION DU FORMULAIRE
    // ==========================================

    initialiserForm(): void {

        this.structureForm = this.fb.group({

            nomStructure: [
                '',
                [
                    Validators.required,
                    Validators.minLength(2)
                ]
            ],

            quartier: [
                '',
                Validators.required
            ],

            typeStructure: [
                EnumTypeStructure.MAIRIE,
                Validators.required
            ],

            telephoneUrgence: [
                ''
            ],

            zoneCouvertureGPS: [
                '',
                Validators.required
            ]

        });

    }

    // ==========================================
    // DÉTECTION CRÉATION / MODIFICATION
    // ==========================================

    detecterMode(): void {

        const id = this.route.snapshot.paramMap.get('id');

        if (id) {

            const idNumerique = Number(id);

            if (!Number.isInteger(idNumerique) || idNumerique <= 0) {

                this.errorMessage =
                    'Identifiant de structure invalide.';

                return;

            }

            this.structureId = idNumerique;
            this.isEditMode = true;

            this.chargerStructure(this.structureId);

        } else {

            this.isEditMode = false;

        }

    }

    // ==========================================
    // CHARGEMENT DE LA STRUCTURE
    // ==========================================

    chargerStructure(idStructure: number): void {

        this.isLoading = true;
        this.errorMessage = '';

        this.structureService
            .obtenirStructureParId(idStructure)
            .subscribe({

                next: (structure) => {

                    this.remplirFormulaire(structure);

                    this.isLoading = false;

                    /*
                     * On attend que le rendu HTML soit actualisé.
                     * La carte est initialisée si elle ne l'est pas
                     * encore, puis la zone existante est affichée.
                     */
                    setTimeout(() => {

                        if (!this.mapInitialized) {
                            this.initialiserCarte();
                        }

                        this.afficherZoneExistante(
                            structure.zoneCouvertureGPS
                        );

                    });

                },

                error: (error) => {

                    console.error(
                        'Erreur lors du chargement de la structure :',
                        error
                    );

                    this.errorMessage =
                        this.extraireMessageErreur(
                            error,
                            'Impossible de charger cette structure.'
                        );

                    this.isLoading = false;

                }

            });

    }

    // ==========================================
    // REMPLIR LE FORMULAIRE
    // ==========================================

    remplirFormulaire(
        structure: StructureCompetenteResponseDto
    ): void {

        this.structureForm.patchValue({

            nomStructure:
                structure.nomStructure,

            quartier:
                structure.quartier || '',

            typeStructure:
                structure.typeStructure,

            telephoneUrgence:
                structure.telephoneUrgence || '',

            zoneCouvertureGPS:
                structure.zoneCouvertureGPS || ''

        });

    }

    // ==========================================
    // INITIALISATION DE LA CARTE LEAFLET
    // ==========================================

    private initialiserCarte(): void {

        if (
            this.mapInitialized ||
            !this.mapContainer?.nativeElement
        ) {
            return;
        }

        this.mapInitialized = true;

        /*
         * Centre initial : Bamako.
         */
        this.map = L.map(
            this.mapContainer.nativeElement,
            {
                center: [
                    12.6392,
                    -8.0029
                ],

                zoom: 12,

                zoomControl: true
            }
        );

        /*
         * Fond OpenStreetMap.
         */
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution:
                    '&copy; OpenStreetMap contributors',

                maxZoom: 19
            }
        ).addTo(this.map);

        /*
         * Groupe contenant les éléments dessinés.
         */
        this.drawnItems = new L.FeatureGroup();

        this.map.addLayer(this.drawnItems);

        /*
         * Outils de dessin.
         * Seuls les polygones sont autorisés.
         */
        const drawControl = new L.Control.Draw({

            position: 'topright',

            edit: {

                featureGroup: this.drawnItems,

                remove: true

            },

            draw: {

                polygon: {

                    allowIntersection: false,

                    showArea: true,

                    shapeOptions: {

                        color: '#2563EB',

                        fillColor: '#3B82F6',

                        fillOpacity: 0.20,

                        weight: 2

                    }

                },

                polyline: false,

                rectangle: false,

                circle: false,

                circlemarker: false,

                marker: false

            }

        });

        this.map.addControl(drawControl);

        /*
         * Création d'un nouveau polygone.
         */
        this.map.on(
            L.Draw.Event.CREATED,
            (event: any) => {

                const layer = event.layer as L.Polygon;

                /*
                 * Une seule zone de couverture
                 * par structure.
                 */
                this.drawnItems.clearLayers();

                this.drawnItems.addLayer(layer);

                this.currentPolygon = layer;

                this.mettreAJourWkt();

                this.errorMessage = '';

            }
        );

        /*
         * Modification du polygone existant.
         */
        this.map.on(
            L.Draw.Event.EDITED,
            () => {

                this.recupererPolygoneActuel();

                this.mettreAJourWkt();

            }
        );

        /*
         * Suppression du polygone.
         */
        this.map.on(
            L.Draw.Event.DELETED,
            () => {

                this.currentPolygon = null;

                const control =
                    this.structureForm.get('zoneCouvertureGPS');

                control?.setValue('');

                control?.markAsTouched();

                control?.markAsDirty();

            }
        );

        /*
         * Actualisation des dimensions de la carte.
         */
        setTimeout(() => {

            if (this.mapInitialized && this.map) {
                this.map.invalidateSize();
            }

        }, 100);

    }

    // ==========================================
    // AFFICHER UNE ZONE EXISTANTE
    // ==========================================

    private afficherZoneExistante(
        wkt: string | undefined
    ): void {

        if (
            !this.mapInitialized ||
            !this.drawnItems ||
            !wkt
        ) {
            return;
        }

        try {

            const coordinates = this.wktVersLatLngs(wkt);

            if (coordinates.length < 4) {

                console.warn(
                    'Zone WKT invalide ou non compatible :',
                    wkt
                );

                return;

            }

            /*
             * Suppression d'une éventuelle ancienne zone.
             */
            this.drawnItems.clearLayers();

            /*
             * Création du polygone Leaflet.
             */
            const polygon = L.polygon(
                coordinates,
                {

                    color: '#2563EB',

                    fillColor: '#3B82F6',

                    fillOpacity: 0.20,

                    weight: 2

                }
            );

            this.drawnItems.addLayer(polygon);

            this.currentPolygon = polygon;

            /*
             * Ajustement de la vue sur la zone.
             */
            this.map.fitBounds(
                polygon.getBounds(),
                {
                    padding: [30, 30]
                }
            );

            setTimeout(() => {

                if (this.mapInitialized && this.map) {
                    this.map.invalidateSize();
                }

            });

        } catch (error) {

            console.error(
                'Impossible d’afficher la zone WKT :',
                error
            );

            this.errorMessage =
                'La zone de couverture existante est invalide.';

        }

    }

    // ==========================================
    // CONVERSION WKT → LEAFLET
    // ==========================================

    private wktVersLatLngs(
        wkt: string
    ): L.LatLngExpression[] {

        const wktNormalise = wkt
            .trim()
            .replace(/^SRID=\d+;/i, '')
            .trim();

        if (
            !wktNormalise
                .toUpperCase()
                .startsWith('POLYGON')
        ) {

            throw new Error(
                'Seuls les POLYGON sont supportés par ce formulaire.'
            );

        }

        const debut = wktNormalise.indexOf('((');

        const fin = wktNormalise.lastIndexOf('))');

        if (
            debut === -1 ||
            fin === -1 ||
            fin <= debut
        ) {

            throw new Error(
                'Format POLYGON WKT invalide.'
            );

        }

        /*
         * Récupération du premier anneau du polygone.
         */
        const contenu = wktNormalise.substring(
            debut + 2,
            fin
        );

        /*
         * Si le polygone contient des anneaux intérieurs,
         * on conserve le premier anneau extérieur.
         */
        const premierAnneau = contenu.split('),(')[0];

        const points = premierAnneau
            .split(',')
            .map((point) => {

                const valeurs = point
                    .trim()
                    .split(/\s+/);

                if (valeurs.length < 2) {

                    throw new Error(
                        'Coordonnée WKT invalide.'
                    );

                }

                /*
                 * WKT : longitude latitude.
                 * Leaflet : latitude longitude.
                 */
                const longitude = Number(valeurs[0]);

                const latitude = Number(valeurs[1]);

                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude) ||
                    latitude < -90 ||
                    latitude > 90 ||
                    longitude < -180 ||
                    longitude > 180
                ) {

                    throw new Error(
                        'Coordonnée GPS invalide.'
                    );

                }

                return [
                    latitude,
                    longitude
                ] as L.LatLngExpression;

            });

        return points;

    }

    // ==========================================
    // CONVERSION LEAFLET → WKT
    // ==========================================

    private polygonVersWkt(
        polygon: L.Polygon
    ): string {

        const latLngs = polygon.getLatLngs();

        /*
         * Pour un polygone simple, le premier élément
         * contient la liste des points de l'anneau extérieur.
         */
        const premierAnneau = latLngs[0] as L.LatLng[];

        if (
            !premierAnneau ||
            premierAnneau.length < 3
        ) {

            throw new Error(
                'Le polygone doit contenir au moins 3 points.'
            );

        }

        const points = premierAnneau.map(
            (latLng) =>
                `${latLng.lng} ${latLng.lat}`
        );

        /*
         * Fermeture du polygone si nécessaire.
         */
        const premierPoint = premierAnneau[0];

        const dernierPoint =
            premierAnneau[premierAnneau.length - 1];

        if (
            premierPoint.lat !== dernierPoint.lat ||
            premierPoint.lng !== dernierPoint.lng
        ) {

            points.push(
                `${premierPoint.lng} ${premierPoint.lat}`
            );

        }

        return `POLYGON((${points.join(', ')}))`;

    }

    // ==========================================
    // RÉCUPÉRER LE POLYGONE ACTUEL
    // ==========================================

    private recupererPolygoneActuel(): void {

        if (!this.drawnItems) {
            this.currentPolygon = null;
            return;
        }

        let polygon: L.Polygon | null = null;

        this.drawnItems.eachLayer((layer) => {

            if (layer instanceof L.Polygon) {
                polygon = layer;
            }

        });

        this.currentPolygon = polygon;

    }

    // ==========================================
    // METTRE À JOUR LE WKT DU FORMULAIRE
    // ==========================================

    private mettreAJourWkt(): void {

        this.recupererPolygoneActuel();

        const control =
            this.structureForm.get('zoneCouvertureGPS');

        if (!this.currentPolygon) {

            control?.setValue('');

            return;

        }

        try {

            const wkt = this.polygonVersWkt(
                this.currentPolygon
            );

            control?.setValue(wkt);

            control?.markAsDirty();

            control?.updateValueAndValidity();

        } catch (error) {

            console.error(
                'Erreur de conversion du polygone vers WKT :',
                error
            );

            control?.setValue('');

            control?.updateValueAndValidity();

        }

    }

    // ==========================================
    // VALIDATION DES CHAMPS
    // ==========================================

    isInvalid(controlName: string): boolean {

        const control = this.structureForm.get(controlName);

        return !!(
            control &&
            control.invalid &&
            (
                control.dirty ||
                control.touched
            )
        );

    }

    // ==========================================
    // ENREGISTREMENT
    // ==========================================

    enregistrer(): void {

        this.errorMessage = '';
        this.successMessage = '';

        /*
         * Récupération de la dernière version du polygone
         * avant de valider et d'envoyer le formulaire.
         */
        this.recupererPolygoneActuel();

        if (this.currentPolygon) {
            this.mettreAJourWkt();
        }

        /*
         * Validation des champs.
         */
        if (this.structureForm.invalid) {

            this.structureForm.markAllAsTouched();

            if (
                !this.structureForm
                    .get('zoneCouvertureGPS')
                    ?.value
            ) {

                this.errorMessage =
                    'Veuillez dessiner la zone de couverture sur la carte.';

            }

            return;

        }

        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;

        const formValue = this.structureForm.getRawValue();

        const dto: StructureCompetenteRequestDto = {

            nomStructure:
                formValue.nomStructure.trim(),

            quartier:
                formValue.quartier?.trim(),

            typeStructure:
                formValue.typeStructure,

            zoneCouvertureGPS:
                formValue.zoneCouvertureGPS,

            telephoneUrgence:
                this.normaliserValeur(
                    formValue.telephoneUrgence
                )

        };

        /*
         * MODIFICATION D'UNE STRUCTURE
         */
        if (
            this.isEditMode &&
            this.structureId !== null
        ) {

            this.structureService
                .modifierStructure(
                    this.structureId,
                    dto
                )
                .subscribe({

                    next: () => {

                        this.isSubmitting = false;

                        this.successMessage =
                            'Structure modifiée avec succès.';

                        this.afficherNotification(
                            'Modification réussie !',
                            'Les informations de la structure ont été modifiées avec succès.'
                        );

                    },

                    error: (error) => {

                        console.error(
                            'Erreur lors de la modification :',
                            error
                        );

                        this.errorMessage =
                            this.extraireMessageErreur(
                                error,
                                'Impossible de modifier cette structure.'
                            );

                        this.isSubmitting = false;

                    }

                });

            return;

        }

        /*
         * CRÉATION D'UNE STRUCTURE
         */
        this.structureService
            .creerStructure(dto)
            .subscribe({

                next: () => {

                    this.isSubmitting = false;

                    this.successMessage =
                        'Structure créée avec succès.';

                    this.afficherNotification(
                        'Création réussie !',
                        'La nouvelle structure a été enregistrée avec succès.'
                    );

                },

                error: (error) => {

                    console.error(
                        'Erreur lors de la création :',
                        error
                    );

                    this.errorMessage =
                        this.extraireMessageErreur(
                            error,
                            'Impossible de créer cette structure.'
                        );

                    this.isSubmitting = false;

                }

            });

    }

    // ==========================================
    // AFFICHER LA POPUP DE SUCCÈS
    // ==========================================

    private afficherNotification(
        titre: string,
        message: string
    ): void {

        this.notificationTitre = titre;

        this.notificationMessage = message;

        this.notificationVisible = true;

    }

    // ==========================================
    // FERMER LA POPUP ET RETOURNER À LA LISTE
    // ==========================================

    fermerNotification(): void {

        if (!this.notificationVisible) {
            return;
        }

        this.notificationVisible = false;

        this.retourListe();

    }

    // ==========================================
    // NORMALISATION DES VALEURS
    // ==========================================

    private normaliserValeur(
        valeur: string | null | undefined
    ): string | undefined {

        if (
            !valeur ||
            !valeur.trim()
        ) {

            return undefined;

        }

        return valeur.trim();

    }

    // ==========================================
    // EXTRACTION DU MESSAGE D'ERREUR
    // ==========================================

    private extraireMessageErreur(
        error: any,
        messageParDefaut: string
    ): string {

        if (error?.error?.message) {
            return error.error.message;
        }

        if (error?.error?.error) {
            return error.error.error;
        }

        if (typeof error?.error === 'string') {
            return error.error;
        }

        return messageParDefaut;

    }

    // ==========================================
    // RETOUR À LA LISTE DES STRUCTURES
    // ==========================================

    retourListe(): void {

        this.router.navigate([
            '/admin/structures'
        ]);

    }

}
