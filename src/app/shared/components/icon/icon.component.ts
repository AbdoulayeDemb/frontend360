import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type IconName =
  | 'arrow-left' | 'tag' | 'clock' | 'alert-triangle' | 'alert-circle' | 'image' | 'mic'
  | 'flag' | 'map-pin' | 'user' | 'building' | 'user-check' | 'user-plus'
  | 'external-link' | 'info' | 'refresh';

/**
 * Icônes SVG au trait (24x24, stroke currentColor).
 * La couleur suit `color` et la taille suit `size` (px).
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-icon', 'aria-hidden': 'true' },
  styles: [':host { display: inline-flex; flex-shrink: 0; line-height: 0; } svg { display: block; }'],
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         [attr.width]="size" [attr.height]="size" [attr.stroke-width]="strokeWidth"
         stroke-linecap="round" stroke-linejoin="round">
      @switch (name) {
        @case ('arrow-left') { <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/> }
        @case ('tag') { <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/> }
        @case ('clock') { <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/> }
        @case ('alert-triangle') { <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/> }
        @case ('alert-circle') { <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/> }
        @case ('image') { <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/> }
        @case ('mic') { <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/> }
        @case ('flag') { <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/> }
        @case ('map-pin') { <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/> }
        @case ('user') { <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/> }
        @case ('building') { <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/> }
        @case ('user-check') { <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/> }
        @case ('user-plus') { <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/> }
        @case ('external-link') { <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3"/> }
        @case ('info') { <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/> }
        @case ('refresh') { <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/> }
      }
    </svg>
  `
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 16;
  @Input() strokeWidth = 1.75;
}
