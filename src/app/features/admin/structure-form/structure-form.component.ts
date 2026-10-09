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

    /*
     * ================================
     * CARTE
     * ================================
     */

    private map!: L.Map;

    private drawnItems!: L.FeatureGroup;

    private currentPolygon: L.Polygon | null = null;

    private mapInitialized = false;


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


    ngOnInit(): void {

        this.initialiserForm();

        this.detecterMode();

    }


    ngAfterViewInit(): void {

        /*
         * La carte est initialisée après que
         * le conteneur HTML soit disponible.
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


    // ============================================================
    // FORMULAIRE
    // ============================================================

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


    detecterMode(): void {

        const id = this.route.snapshot.paramMap.get('id');

        if (id) {

            this.structureId = Number(id);

            this.isEditMode = true;

            this.chargerStructure(this.structureId);

        } else {

            this.isEditMode = false;

        }

    }


    // ============================================================
    // CHARGEMENT STRUCTURE
    // ============================================================

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
                     * Si la carte est déjà prête,
                     * on affiche immédiatement le polygone.
                     */
                    setTimeout(() => {

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


    // ============================================================
    // CARTE LEAFLET
    // ============================================================

    private initialiserCarte(): void {

        if (
            this.mapInitialized ||
            !this.mapContainer
        ) {

            return;

        }

        this.mapInitialized = true;

        /*
         * Centre de Bamako
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
         * Fond OpenStreetMap
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
        this.drawnItems =
            new L.FeatureGroup();

        this.map.addLayer(
            this.drawnItems
        );


        /*
         * Outils de dessin.
         *
         * On autorise uniquement le polygone.
         */
        const drawControl =
            new L.Control.Draw({

                position: 'topright',

                edit: {

                    featureGroup:
                        this.drawnItems,

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


        this.map.addControl(
            drawControl
        );


        /*
         * Lorsqu'un nouveau polygone est créé.
         */
        this.map.on(
            L.Draw.Event.CREATED,
            (event: any) => {

                const layer =
                    event.layer as L.Polygon;

                /*
                 * Une seule zone de couverture
                 * par structure.
                 */
                this.drawnItems.clearLayers();

                this.drawnItems.addLayer(
                    layer
                );

                this.currentPolygon =
                    layer;

                this.mettreAJourWkt();

            }
        );


        /*
         * Lorsqu'un polygone existant est modifié.
         */
        this.map.on(
            L.Draw.Event.EDITED,
            () => {

                this.recupererPolygoneActuel();

                this.mettreAJourWkt();

            }
        );


        /*
         * Lorsqu'un polygone est supprimé.
         */
        this.map.on(
            L.Draw.Event.DELETED,
            () => {

                this.currentPolygon = null;

                this.structureForm
                    .get('zoneCouvertureGPS')
                    ?.setValue('');

                this.structureForm
                    .get('zoneCouvertureGPS')
                    ?.markAsTouched();

            }
        );


        /*
         * Petit délai pour éviter le problème
         * classique Leaflet avec les dimensions.
         */
        setTimeout(() => {

            this.map.invalidateSize();

        }, 100);

    }


    // ============================================================
    // POLYGONE EXISTANT
    // ============================================================

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

            const coordinates =
                this.wktVersLatLngs(wkt);

            if (
                !coordinates ||
                coordinates.length < 3
            ) {

                console.warn(
                    'Zone WKT invalide ou non compatible :',
                    wkt
                );

                return;

            }


            /*
             * Nettoyage d'une éventuelle
             * ancienne zone.
             */
            this.drawnItems.clearLayers();


            /*
             * Création du polygone Leaflet.
             */
            const polygon =
                L.polygon(
                    coordinates,
                    {

                        color: '#2563EB',

                        fillColor: '#3B82F6',

                        fillOpacity: 0.20,

                        weight: 2

                    }
                );


            this.drawnItems.addLayer(
                polygon
            );


            this.currentPolygon =
                polygon;


            /*
             * Ajustement de la vue.
             */
            this.map.fitBounds(
                polygon.getBounds(),
                {
                    padding: [30, 30]
                }
            );


        } catch (error) {

            console.error(
                'Impossible d afficher la zone WKT :',
                error
            );

            this.errorMessage =
                'La zone de couverture existante est invalide.';

        }

    }


    // ============================================================
    // WKT → LEAFLET
    // ============================================================

    private wktVersLatLngs(
        wkt: string
    ): L.LatLngExpression[] {

        const wktNormalise =
            wkt
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


        const debut =
            wktNormalise.indexOf('((');

        const fin =
            wktNormalise.lastIndexOf('))');


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
         * On récupère le premier anneau du polygone.
         *
         * Exemple :
         *
         * POLYGON((
         * -8.02 12.63,
         * -8.01 12.63,
         * -8.01 12.64,
         * -8.02 12.64,
         * -8.02 12.63
         * ))
         */
        const contenu =
            wktNormalise.substring(
                debut + 2,
                fin
            );


        /*
         * Si le polygone possède plusieurs anneaux,
         * on garde uniquement le premier.
         */
        const premierAnneau =
            contenu.split('),(')[0];


        const points =
            premierAnneau
                .split(',')
                .map(
                    (point) => {

                        const valeurs =
                            point
                                .trim()
                                .split(/\s+/);

                        if (
                            valeurs.length < 2
                        ) {

                            throw new Error(
                                'Coordonnée WKT invalide.'
                            );

                        }

                        /*
                         * WKT :
                         * longitude latitude
                         *
                         * Leaflet :
                         * latitude longitude
                         */
                        const longitude =
                            Number(valeurs[0]);

                        const latitude =
                            Number(valeurs[1]);


                        if (
                            !Number.isFinite(latitude) ||
                            !Number.isFinite(longitude)
                        ) {

                            throw new Error(
                                'Coordonnée GPS invalide.'
                            );

                        }


                        return [
                            latitude,
                            longitude
                        ] as L.LatLngExpression;

                    }
                );


        return points;

    }


    // ============================================================
    // LEAFLET → WKT
    // ============================================================

    private polygonVersWkt(
        polygon: L.Polygon
    ): string {

        const latLngs =
            polygon.getLatLngs();


        /*
         * Pour un Polygon simple,
         * Leaflet renvoie un tableau de LatLng.
         */
        const premierAnneau =
            latLngs[0] as L.LatLng[];


        if (
            !premierAnneau ||
            premierAnneau.length < 3
        ) {

            throw new Error(
                'Le polygone doit contenir au moins 3 points.'
            );

        }


        const points =
            premierAnneau.map(
                (latLng) =>
                    `${latLng.lng} ${latLng.lat}`
            );


        /*
         * Fermeture du polygone.
         */
        const premierPoint =
            premierAnneau[0];

        const dernierPoint =
            premierAnneau[
            premierAnneau.length - 1
            ];


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


    // ============================================================
    // RÉCUPÉRER POLYGONE
    // ============================================================

    private recupererPolygoneActuel(): void {

        let polygon: L.Polygon | null = null;

        this.drawnItems.eachLayer(
            (layer) => {

                if (
                    layer instanceof L.Polygon
                ) {

                    polygon =
                        layer;

                }

            }
        );


        this.currentPolygon =
            polygon;

    }


    // ============================================================
    // METTRE À JOUR LE WKT DU FORMULAIRE
    // ============================================================

    private mettreAJourWkt(): void {

        this.recupererPolygoneActuel();


        if (!this.currentPolygon) {

            this.structureForm
                .get('zoneCouvertureGPS')
                ?.setValue('');

            return;

        }


        try {

            const wkt =
                this.polygonVersWkt(
                    this.currentPolygon
                );


            this.structureForm
                .get('zoneCouvertureGPS')
                ?.setValue(wkt);


            this.structureForm
                .get('zoneCouvertureGPS')
                ?.markAsDirty();


        } catch (error) {

            console.error(
                'Erreur conversion polygone → WKT :',
                error
            );

            this.structureForm
                .get('zoneCouvertureGPS')
                ?.setValue('');

        }

    }


    // ============================================================
    // VALIDATION
    // ============================================================

    isInvalid(
        controlName: string
    ): boolean {

        const control =
            this.structureForm.get(
                controlName
            );


        return !!(
            control &&
            control.invalid &&
            (
                control.dirty ||
                control.touched
            )
        );

    }


    // ============================================================
    // ENREGISTREMENT
    // ============================================================

    enregistrer(): void {

        this.errorMessage = '';

        this.successMessage = '';


        /*
         * Avant validation, on récupère
         * une dernière fois le polygone.
         */
        this.recupererPolygoneActuel();

        if (this.currentPolygon) {

            this.mettreAJourWkt();

        }


        if (
            this.structureForm.invalid
        ) {

            this.structureForm
                .markAllAsTouched();


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


        this.isSubmitting = true;


        const formValue =
            this.structureForm.value;


        const dto:
            StructureCompetenteRequestDto = {

            nomStructure:
                formValue.nomStructure
                    .trim(),

            quartier:
                formValue.quartier
                    ?.trim(),

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
         * MODIFICATION
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

                        this.isSubmitting =
                            false;

                        this.successMessage =
                            'Structure modifiée avec succès.';


                        setTimeout(() => {

                            this.retourListe();

                        }, 700);

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


                        this.isSubmitting =
                            false;

                    }

                });

            return;

        }


        /*
         * CRÉATION
         */
        this.structureService
            .creerStructure(dto)
            .subscribe({

                next: () => {

                    this.isSubmitting =
                        false;

                    this.successMessage =
                        'Structure créée avec succès.';


                    setTimeout(() => {

                        this.retourListe();

                    }, 700);

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


                    this.isSubmitting =
                        false;

                }

            });

    }


    // ============================================================
    // UTILITAIRES
    // ============================================================

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


    private extraireMessageErreur(
        error: any,
        messageParDefaut: string
    ): string {

        if (
            error?.error?.message
        ) {

            return error.error.message;

        }


        if (
            error?.error?.error
        ) {

            return error.error.error;

        }


        if (
            typeof error?.error === 'string'
        ) {

            return error.error;

        }


        return messageParDefaut;

    }


    retourListe(): void {

        this.router.navigate([
            '/admin/structures'
        ]);

    }

}