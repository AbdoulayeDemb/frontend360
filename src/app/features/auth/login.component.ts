import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { EnumRole } from '../../core/models/enums.model';
import { LoginRequestDto } from '../../core/models/auth.model';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    loginForm!: FormGroup;

    showPassword = false;
    isLoading = false;
    errorMessage = '';

    ngOnInit(): void {

        this.loginForm = this.fb.group({
            telephone: [
                '',
                [
                    Validators.required,
                    Validators.pattern(/^[0-9]{8,15}$/)
                ]
            ],

            motDePasse: [
                '',
                [
                    Validators.required
                ]
            ],

            seSouvenirDeMoi: [false]
        });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    isFieldInvalid(fieldName: string): boolean {

        const field = this.loginForm.get(fieldName);

        return !!(
            field &&
            field.invalid &&
            (field.dirty || field.touched)
        );
    }

    onSubmit(): void {

        if (this.loginForm.invalid) {

            this.loginForm.markAllAsTouched();

            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const credentials: LoginRequestDto = {
            telephone: this.loginForm.value.telephone,
            motDePasse: this.loginForm.value.motDePasse
        };

        this.authService.login(credentials).subscribe({

            next: (response) => {

                this.isLoading = false;

                console.log(
                    'Connexion réussie :',
                    response
                );

                const user =
                    this.authService.currentUserValue;

                if (!user) {

                    this.errorMessage =
                        "Impossible de récupérer l'utilisateur connecté.";

                    return;
                }

                /*
                 * Redirection selon le rôle.
                 */
                switch (user.role) {

                    case EnumRole.ADMIN:

                        this.router.navigate([
                            '/admin/dashboard'
                        ]);

                        break;

                    case EnumRole.STRUCTURE:

                        if (user.estResponsable === true) {

                            this.router.navigate([
                                '/structure/dashboard'
                            ]);

                        } else {

                            this.errorMessage =
                                "Accès refusé. Le portail web est réservé aux responsables de structure.";

                            this.authService.logout();
                        }

                        break;

                    case EnumRole.CITOYEN:

                        this.errorMessage =
                            "Accès réservé aux administrateurs et responsables de structure.";

                        this.authService.logout();

                        break;

                    default:

                        this.errorMessage =
                            "Rôle utilisateur non reconnu.";

                        this.authService.logout();

                        break;
                }
            },

            error: (err) => {

                this.isLoading = false;

                console.error(
                    'Erreur lors de la connexion :',
                    err
                );

                if (
                    err.status === 401 ||
                    err.status === 403
                ) {

                    this.errorMessage =
                        'Numéro de téléphone ou mot de passe incorrect.';

                } else if (err.status === 0) {

                    this.errorMessage =
                        'Impossible de contacter le serveur backend. Vérifiez que Spring Boot est démarré.';

                } else {

                    this.errorMessage =
                        err.error?.message ||
                        'Une erreur est survenue lors de la connexion.';
                }
            }
        });
    }
}