import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ValidateUrlComponent } from './validate-url/validate-url.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./view/authentication/authentication.module').then(l => l.AuthenticationModule)
  },
  // {
  //   path: ':id',
  //   component: ValidateUrlComponent
  // },
  {
    path: 'home',
    loadChildren: () =>
      import('./view/front-view/front-view.module').then((m) => m.FrontViewModule),
  },
  {
    path: 'authenticate',
    loadChildren: () => import('./view/authentication/authentication.module').then(l => l.AuthenticationModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./view/profile/profile.module').then(l => l.ProfileModule)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./view/view.module').then((m) => m.ViewModule),
  },
  {
    path: 'authentication',
    loadChildren: () =>
      import('./view/authentication/authentication.module').then((m) => m.AuthenticationModule),
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./view/profile/profile.module').then((m) => m.ProfileModule),
  },
  {
    path: 'ealbum',
    loadChildren: () => import('./view-album/view-album.module').then(z => z.ViewAlbumModule)
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
