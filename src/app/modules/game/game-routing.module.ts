import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LobbyComponent} from './pages/lobby/lobby.component';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {AuthorizationInterceptor} from '../../core/interceptors/authorization.interceptor';
import {GameComponent} from './pages/game/game.component';
import { TestComponent } from './pages/test/test.component';

const routes: Routes = [
  {
    path: 'lobby',
    component: LobbyComponent
  },
  {
    path: 'test',
    component: TestComponent
  },
  {
    path: 'play',
    component: GameComponent,
    children: [
      {path: '', component: GameComponent, pathMatch: 'full'}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [{provide: HTTP_INTERCEPTORS, useClass: AuthorizationInterceptor, multi: true}]
})
export class GameRoutingModule {
}
