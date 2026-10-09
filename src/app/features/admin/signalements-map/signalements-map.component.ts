import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

import * as L from 'leaflet';
import 'leaflet.markercluster';

import { SignalementService } from '../../../core/services/signalement.service';
import { Signalement } from '../../../core/models/signalement.model';


interface StatistiqueCategorie {
  categorie: string;
  nombre: number;
  pourcentage: number;
}

import { AuthService } from '../../../core/services/auth.service';
import { EnumRole } from '../../../core/models/enums.model';

@Component({
  selector: 'app-signalements-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signalements-map.component.html',
  styleUrls: ['./signalements-map.component.css']
})
export class SignalementsMapComponent
  implements AfterViewInit, OnDestroy {


  // ============================================================
  // SERVICE
  // ============================================================

  private readonly signalementService =
    inject(SignalementService);


  // ============================================================
  // CONTENEUR CARTE
  // ============================================================

  private readonly authService =
    inject(AuthService);

  @ViewChild('mapContainer', { static: false })
  private mapContainer!: ElementRef<HTMLDivElement>;


  // ============================================================
  // LEAFLET
  // ============================================================

  private map!: L.Map;

  private markersLayer!: L.MarkerClusterGroup;


  // ============================================================
  // SIGNALEMENTS
  // ============================================================

  private signalements: Signalement[] = [];


  // ============================================================
  // STATISTIQUES
  // ============================================================

  statistiquesCategories: StatistiqueCategorie[] = [];


  /**
   * Nombre de signalements réellement affichés
   * sur la carte.
   *
   * Attention :
   * ce nombre correspond aux signalements,
   * pas au nombre de clusters.
   */
  nombreSignalementsAffiches = 0;


  // ============================================================
  // DESTRUCTION
  // ============================================================

  private composantDetruit = false;


  // ============================================================
  // BAMAKO
  // ============================================================

  /**
   * Centre de Bamako.
   */
  private readonly BAMAKO_LATITUDE = 12.6392;

  private readonly BAMAKO_LONGITUDE = -8.0029;


  /**
   * Zoom initial.
   */
  private readonly BAMAKO_ZOOM = 12;


  /**
   * Limites raisonnables autour de Bamako.
   *
   * Elles permettent d'éviter qu'une mauvaise coordonnée
   * ou une latitude/longitude inversée fasse dézoomer
   * toute la carte.
   */
  private readonly BAMAKO_LAT_MIN = 12.45;

  private readonly BAMAKO_LAT_MAX = 12.80;

  private readonly BAMAKO_LNG_MIN = -8.20;

  private readonly BAMAKO_LNG_MAX = -7.80;


  // ============================================================
  // INITIALISATION
  // ============================================================

  ngAfterViewInit(): void {

    console.log(
      '🗺️ SignalementsMapComponent chargé'
    );

    this.attendreConteneur();
  }


  /**
   * Attend que le conteneur possède réellement
   * une largeur et une hauteur.
   */
  private attendreConteneur(): void {

    if (this.composantDetruit) {
      return;
    }


    if (!this.mapContainer) {

      console.error(
        '❌ Conteneur de la carte introuvable.'
      );

      return;
    }


    const element =
      this.mapContainer.nativeElement;


    const width =
      element.offsetWidth;


    const height =
      element.offsetHeight;


    console.log(
      '📐 Vérification conteneur :',
      width,
      'x',
      height
    );


    if (width === 0 || height === 0) {

      console.warn(
        '⏳ Le conteneur est encore à 0 x 0. Nouvelle tentative...'
      );


      setTimeout(() => {

        if (!this.composantDetruit) {

          this.attendreConteneur();
        }

      }, 100);


      return;
    }


    console.log(
      '✅ Conteneur prêt :',
      width,
      'x',
      height
    );


    this.initialiserCarte();

    this.chargerSignalements();
  }


  // ============================================================
  // CARTE LEAFLET
  // ============================================================

  private initialiserCarte(): void {

    if (this.composantDetruit) {
      return;
    }


    if (!this.mapContainer) {

      console.error(
        '❌ Conteneur Leaflet introuvable.'
      );

      return;
    }


    const element =
      this.mapContainer.nativeElement;


    console.log(
      '📦 Conteneur Leaflet :',
      element
    );


    console.log(
      '📐 Dimensions finales :',
      element.offsetWidth,
      'x',
      element.offsetHeight
    );


    // ==========================================================
    // CRÉATION CARTE
    // ==========================================================

    this.map = L.map(element, {

      center: [
        this.BAMAKO_LATITUDE,
        this.BAMAKO_LONGITUDE
      ],

      zoom: this.BAMAKO_ZOOM,

      zoomControl: true,

      attributionControl: true

    });


    console.log(
      '✅ Carte Leaflet créée'
    );


    // ==========================================================
    // OPENSTREETMAP
    // ==========================================================

    const tileLayer =
      L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,

          minZoom: 3,

          attribution:
            '&copy; OpenStreetMap contributors'
        }
      );


    tileLayer.addTo(this.map);


    console.log(
      '🌍 Couche OpenStreetMap ajoutée'
    );


    tileLayer.on(
      'tileload',
      () => {

        console.log(
          '🧩 Tuile OpenStreetMap chargée'
        );

      }
    );


    tileLayer.on(
      'tileerror',
      (event) => {

        console.error(
          '❌ Erreur tuile OpenStreetMap :',
          event
        );

      }
    );


    // ==========================================================
    // CLUSTERING
    // ==========================================================

    this.markersLayer =
      L.markerClusterGroup({

        showCoverageOnHover: false,

        spiderfyOnMaxZoom: true,

        removeOutsideVisibleBounds: true,

        animate: true,

        animateAddingMarkers: true,

        maxClusterRadius: 45,

        disableClusteringAtZoom: 17,

        zoomToBoundsOnClick: true,

        spiderfyDistanceMultiplier: 1.4,

        iconCreateFunction:
          (cluster: L.MarkerCluster): L.DivIcon => {

            return this.creerIconeCluster(
              cluster
            );

          }

      });


    this.markersLayer.addTo(this.map);


    console.log(
      '🧩 Groupe de clustering Leaflet créé'
    );


    // ==========================================================
    // INVALIDATE SIZE
    // ==========================================================

    setTimeout(() => {

      if (
        !this.composantDetruit &&
        this.map
      ) {

        this.map.invalidateSize();

        console.log(
          '📐 Taille Leaflet recalculée'
        );

      }

    }, 300);

  }


  // ============================================================
  // CHARGEMENT DES SIGNALEMENTS
  // ============================================================

  private chargerSignalements(): void {

    console.log(
      '📡 Chargement des signalements...'
    );



    const idStructure = this.authService.getIdStructure();
    if (this.isStructureMode && idStructure === null) {
      this.errorMessage = 'Aucune structure n’est associée à ce compte.';
      return;
    }

    const signalements$ = this.isStructureMode && idStructure !== null
      ? this.signalementService.getByStructure(idStructure)
      : this.signalementService.getAll();

    signalements$
      .subscribe({

        next: (
          signalements: Signalement[]
        ) => {

          console.log(
            '✅ Signalements reçus :',
            signalements.length
          );



          this.errorMessage = '';
          this.signalements =
            signalements;


          // ======================================================
          // CALCUL DES STATISTIQUES
          // ======================================================

          this.calculerStatistiquesCategories();


          // ======================================================
          // AFFICHAGE CARTE
          // ======================================================

          this.afficherSignalements();

        },


        error: (error) => {

          console.error(
            '❌ Erreur de chargement des signalements :',
            error
          );



          this.errorMessage = 'Impossible de charger les signalements sur la carte.';
          this.nombreSignalementsAffiches = 0;

          this.statistiquesCategories = [];

        }

      });

  }


  // ============================================================
  // STATISTIQUES PAR CATÉGORIE
  // ============================================================

  private calculerStatistiquesCategories(): void {

    const compteurs =
      new Map<string, number>();


    // ==========================================================
    // COMPTAGE
    // ==========================================================

    this.signalements.forEach(
      (signalement: Signalement) => {

        const categorie =
          signalement.nomCategorie?.trim() ||
          'Non catégorisée';


        const nombreActuel =
          compteurs.get(categorie) || 0;


        compteurs.set(
          categorie,
          nombreActuel + 1
        );

      }
    );


    // ==========================================================
    // TOTAL
    // ==========================================================

    const total =
      this.signalements.length;


    if (total === 0) {

      this.statistiquesCategories = [];

      return;
    }


    // ==========================================================
    // TRANSFORMATION
    // ==========================================================

    this.statistiquesCategories =
      Array.from(compteurs.entries())

        .map(
          ([categorie, nombre]) => {

            return {

              categorie,

              nombre,

              pourcentage:
                Math.round(
                  (nombre / total) * 100
                )

            };

          }
        )

        // Plus grand nombre en premier
        .sort(
          (a, b) =>
            b.nombre - a.nombre
        );


    console.log(
      '📊 Statistiques par catégorie :',
      this.statistiquesCategories
    );

  }


  // ============================================================
  // AFFICHAGE DES SIGNALEMENTS
  // ============================================================

  private afficherSignalements(): void {

    if (!this.map) {

      console.error(
        '❌ Carte non initialisée.'
      );

      return;
    }


    if (!this.markersLayer) {

      console.error(
        '❌ Couche de clusters non initialisée.'
      );

      return;
    }


    // ==========================================================
    // NETTOYAGE
    // ==========================================================

    this.markersLayer.clearLayers();

    this.nombreSignalementsAffiches = 0;


    if (
      !this.signalements ||
      this.signalements.length === 0
    ) {

      console.log(
        'ℹ️ Aucun signalement à afficher.'
      );


      this.recentrerSurBamako();

      return;
    }


    let nombreAffiches = 0;

    let nombreIgnores = 0;


    // ==========================================================
    // PARCOURS DES SIGNALEMENTS
    // ==========================================================

    this.signalements.forEach(
      (
        signalement: Signalement
      ) => {

        const latitude =
          Number(signalement.latitude);


        const longitude =
          Number(signalement.longitude);


        // ------------------------------------------------------
        // Vérification numérique
        // ------------------------------------------------------

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {

          console.warn(
            '⚠️ Coordonnées invalides :',
            signalement.idSignalement,
            latitude,
            longitude
          );


          nombreIgnores++;

          return;
        }


        // ------------------------------------------------------
        // Vérification latitude
        // ------------------------------------------------------

        if (
          latitude < -90 ||
          latitude > 90
        ) {

          console.warn(
            '⚠️ Latitude invalide :',
            signalement.idSignalement,
            latitude
          );


          nombreIgnores++;

          return;
        }


        // ------------------------------------------------------
        // Vérification longitude
        // ------------------------------------------------------

        if (
          longitude < -180 ||
          longitude > 180
        ) {

          console.warn(
            '⚠️ Longitude invalide :',
            signalement.idSignalement,
            longitude
          );


          nombreIgnores++;

          return;
        }


        // ------------------------------------------------------
        // Vérification zone Bamako
        // ------------------------------------------------------

        const estDansBamako =
          this.estDansZoneBamako(
            latitude,
            longitude
          );


        if (!estDansBamako) {

          console.warn(
            '⚠️ Signalement hors zone de Bamako :',
            signalement.idSignalement,
            'lat =',
            latitude,
            'lng =',
            longitude
          );


          nombreIgnores++;

          return;
        }


        console.log(
          '📍 Signalement affiché :',
          signalement.idSignalement,
          latitude,
          longitude
        );


        // ======================================================
        // COULEUR SELON URGENCE
        // ======================================================

        const couleur =
          this.getUrgenceColor(
            signalement.typeUrgence
          );


        // ======================================================
        // MARQUEUR
        // ======================================================

        const marker =
          L.marker(
            [
              latitude,
              longitude
            ],
            {
              icon:
                this.creerIconeUrgence(
                  couleur
                ),

              riseOnHover: true,

              keyboard: true,

              title:
                `Signalement #${signalement.idSignalement}`
            }
          );


        // ======================================================
        // POPUP
        // ======================================================

        marker.bindPopup(
          this.construirePopup(
            signalement
          ),
          {
            maxWidth: 320,

            minWidth: 240
          }
        );


        // ======================================================
        // AJOUT AU CLUSTER
        // ======================================================

        this.markersLayer.addLayer(
          marker
        );


        nombreAffiches++;

      }
    );


    // ==========================================================
    // COMPTEUR
    // ==========================================================

    this.nombreSignalementsAffiches =
      nombreAffiches;


    console.log(
      '🗺️ Signalements affichés :',
      nombreAffiches
    );


    console.log(
      '⚠️ Signalements ignorés :',
      nombreIgnores
    );


    // ==========================================================
    // RECENTRAGE
    // ==========================================================

    this.recentrerSurBamako();


    // ==========================================================
    // RECALCUL DE LA TAILLE
    // ==========================================================

    setTimeout(() => {

      if (
        !this.composantDetruit &&
        this.map
      ) {

        this.map.invalidateSize();

      }

    }, 100);

  }


  // ============================================================
  // CENTRAGE BAMAKO
  // ============================================================

  private recentrerSurBamako(): void {

    if (!this.map) {
      return;
    }


    this.map.setView(
      [
        this.BAMAKO_LATITUDE,
        this.BAMAKO_LONGITUDE
      ],

      this.BAMAKO_ZOOM,

      {
        animate: false
      }
    );

  }


  // ============================================================
  // VALIDATION ZONE BAMAKO
  // ============================================================

  private estDansZoneBamako(
    latitude: number,
    longitude: number
  ): boolean {

    return (

      latitude >= this.BAMAKO_LAT_MIN &&

      latitude <= this.BAMAKO_LAT_MAX &&

      longitude >= this.BAMAKO_LNG_MIN &&

      longitude <= this.BAMAKO_LNG_MAX

    );

  }


  // ============================================================
  // ICÔNE MARQUEUR URGENCE
  // ============================================================

  private creerIconeUrgence(
    couleur: string
  ): L.DivIcon {

    return L.divIcon({

      className:
        'signalement-marker-icon',

      html: `
        <div
          style="
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(255,255,255,0.95);
            box-shadow:
              0 2px 7px rgba(15,23,42,0.22);
          "
        >
          <span
            style="
              display: block;
              width: 11px;
              height: 11px;
              border-radius: 50%;
              background-color: ${couleur};
              box-shadow:
                0 0 0 1px rgba(255,255,255,0.9);
            "
          ></span>
        </div>
      `,

      iconSize: [
        18,
        18
      ],

      iconAnchor: [
        9,
        9
      ],

      popupAnchor: [
        0,
        -10
      ]

    });

  }


  // ============================================================
  // ICÔNE CLUSTER
  // ============================================================

  private creerIconeCluster(
    cluster: L.MarkerCluster
  ): L.DivIcon {

    const nombre =
      cluster.getChildCount();


    let taille = 40;

    let couleur = '#2563EB';


    // Petit cluster

    if (nombre >= 5) {

      taille = 46;

      couleur = '#7C3AED';

    }


    // Gros cluster

    if (nombre >= 10) {

      taille = 52;

      couleur = '#EF4444';

    }


    return L.divIcon({

      className:
        'signalement-cluster-icon',

      html: `
        <div
          style="
            width: ${taille}px;
            height: ${taille}px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background-color: ${couleur};

            border:
              4px solid
              rgba(255,255,255,0.92);

            box-shadow:
              0 3px 10px
              rgba(15,23,42,0.25);

            color: #FFFFFF;

            font-family:
              Inter,
              Arial,
              sans-serif;

            font-size:
              ${nombre >= 10 ? '14px' : '13px'};

            font-weight: 700;

            line-height: 1;
          "
        >
          ${nombre}
        </div>
      `,

      iconSize: [
        taille,
        taille
      ],

      iconAnchor: [
        taille / 2,
        taille / 2
      ]

    });

  }


  // ============================================================
  // COULEUR URGENCE
  // ============================================================

  private getUrgenceColor(
    urgence: any
  ): string {

    switch (urgence) {

      case 'FAIBLE':
        return '#22C55E';

      case 'MOYENNE':
        return '#EAB308';

      case 'ELEVEE':
        return '#F97316';

      case 'CRITIQUE':
        return '#EF4444';

      default:
        return '#2563EB';

    }

  }


  // ============================================================
  // POPUP
  // ============================================================

  private construirePopup(
    signalement: Signalement
  ): string {

    const categorie =
      this.echapperHtml(
        signalement.nomCategorie ||
        'Non catégorisée'
      );


    const tracking =
      this.echapperHtml(
        signalement.codeTrackingUnique ||
        '-'
      );


    const description =
      this.echapperHtml(
        signalement.description ||
        'Aucune description'
      );


    const urgence =
      this.getUrgenceLabel(
        signalement.typeUrgence
      );


    const statut =
      this.getStatutLabel(
        signalement.statut
      );


    const structure =
      this.echapperHtml(
        signalement.nomStructureAssignee ||
        'Non assignée'
      );


    const citoyen =
      this.echapperHtml(
        signalement.citoyenNomComplet ||
        'Non renseigné'
      );


    const date =
      signalement.dateHeureAlerte
        ? this.formatDate(
          signalement.dateHeureAlerte
        )
        : '-';


    return `
      <div
        style="
          min-width: 240px;
          max-width: 300px;
          font-family:
            Inter,
            Arial,
            sans-serif;
        "
      >

        <div
          style="
            margin-bottom: 5px;
            color: #64748b;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          "
        >
          Signalement
        </div>


        <div
          style="
            margin-bottom: 7px;
            color: #1e293b;
            font-size: 14px;
            font-weight: 700;
          "
        >
          ${categorie}
        </div>


        <div
          style="
            margin-bottom: 10px;
            color: #64748b;
            font-size: 11px;
          "
        >
          ${tracking}
        </div>


        <div
          style="
            margin-bottom: 10px;
            padding: 8px;
            background: #f8fafc;
            border-radius: 6px;
            color: #334155;
            font-size: 11px;
            line-height: 1.5;
          "
        >
          ${description}
        </div>


        <div
          style="
            margin-bottom: 5px;
            color: #334155;
            font-size: 11px;
          "
        >
          <strong>Urgence :</strong>
          ${urgence}
        </div>


        <div
          style="
            margin-bottom: 5px;
            color: #334155;
            font-size: 11px;
          "
        >
          <strong>Statut :</strong>
          ${statut}
        </div>


        <div
          style="
            margin-bottom: 5px;
            color: #334155;
            font-size: 11px;
          "
        >
          <strong>Citoyen :</strong>
          ${citoyen}
        </div>


        <div
          style="
            margin-bottom: 5px;
            color: #334155;
            font-size: 11px;
          "
        >
          <strong>Structure :</strong>
          ${structure}
        </div>


        <div
          style="
            color: #64748b;
            font-size: 10px;
          "
        >
          ${date}
        </div>

      </div>
    `;

  }


  // ============================================================
  // STATUT
  // ============================================================

  private getStatutLabel(
    statut: any
  ): string {

    switch (statut) {

      case 'DECLARE':
        return 'Déclaré';

      case 'EN_COURS':
        return 'En cours';

      case 'RESOLU':
        return 'Résolu';

      case 'REJETE':
        return 'Rejeté';

      default:
        return statut || '-';

    }

  }


  // ============================================================
  // URGENCE
  // ============================================================

  private getUrgenceLabel(
    urgence: any
  ): string {

    switch (urgence) {

      case 'FAIBLE':
        return 'Faible';

      case 'MOYENNE':
        return 'Moyenne';

      case 'ELEVEE':
        return 'Élevée';

      case 'CRITIQUE':
        return 'Critique';

      default:
        return urgence || '-';

    }

  }


  // ============================================================
  // FORMAT DATE
  // ============================================================

  private formatDate(
    date: string
  ): string {

    try {

      return new Intl.DateTimeFormat(
        'fr-FR',
        {
          day: '2-digit',

          month: '2-digit',

          year: 'numeric',

          hour: '2-digit',

          minute: '2-digit'
        }
      ).format(
        new Date(date)
      );

    } catch {

      return date;

    }

  }


  // ============================================================
  // SÉCURITÉ HTML
  // ============================================================

  private echapperHtml(
    value: string
  ): string {

    return String(value)

      .replace(
        /&/g,
        '&amp;'
      )

      .replace(
        /</g,
        '&lt;'
      )

      .replace(
        />/g,
        '&gt;'
      )

      .replace(
        /"/g,
        '&quot;'
      )

      .replace(
        /'/g,
        '&#039;'
      );

  }


  // ============================================================
  // DESTRUCTION
  // ============================================================

  ngOnDestroy(): void {

    this.composantDetruit = true;


    if (this.map) {

      this.map.remove();


      console.log(
        '🗺️ Carte Leaflet détruite'
      );

    }

  }

}