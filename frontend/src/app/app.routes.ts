import { Routes } from '@angular/router';
import { wizardStepGuard } from './core/guards/wizard-step.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/introduction/introduction.component').then(m => m.IntroductionComponent)
  },
  {
    path: 'postcode',
    loadComponent: () => import('./features/postcode-verification/postcode-verification.component').then(m => m.PostcodeVerificationComponent)
  },
  {
    path: 'two-factor',
    loadComponent: () => import('./features/two-factor/two-factor.component').then(m => m.TwoFactorComponent),
    canActivate: [wizardStepGuard]
  },
  {
    path: 'document',
    loadComponent: () => import('./features/document-viewer/document-viewer.component').then(m => m.DocumentViewerComponent),
    canActivate: [wizardStepGuard]
  },
  {
    path: 'preview',
    loadComponent: () => import('./features/preview/preview.component').then(m => m.PreviewComponent),
    canActivate: [wizardStepGuard]
  },
  {
    path: 'complete',
    loadComponent: () => import('./features/completion/completion.component').then(m => m.CompletionComponent)
  },
  {
    path: 'expired',
    loadComponent: () => import('./shared/components/session-expired/session-expired.component').then(m => m.SessionExpiredComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

