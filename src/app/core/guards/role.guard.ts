import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EnumRole } from '../models/enums.model';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.currentUserValue;
    const expectedRoles = route.data['roles'] as EnumRole[];

    if (!currentUser) {
        return router.createUrlTree(['/auth/login']);
    }

    // 1. Vérification du rôle global
    const hasRole = expectedRoles.includes(currentUser.role);

    if (!hasRole) {
        return router.createUrlTree(['/auth/acces-refuse']);
    }

    // 2. Règle spécifique Web : un agent de structure doit être Responsable (estResponsable = true)
    if (currentUser.role === EnumRole.STRUCTURE) {
        const estResponsable = (currentUser as any).estResponsable;

        if (!estResponsable) {
            // Bloque l'accès web aux agents de terrain (estResponsable = false)
            console.warn('Accès Web refusé : Réservé aux responsables de structure.');
            return router.createUrlTree(['/auth/acces-refuse'], {
                queryParams: { reason: 'mobile_only' }
            });
        }
    }

    return true;
};