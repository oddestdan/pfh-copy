import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {MainRoutingModule} from './main-routing.module';
import {MainComponent} from './main.component';
import {WelcomeComponent} from './components/welcome/welcome.component';
import {AboutComponent} from './components/about/about.component';
import {SharedModule} from '../../shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ModalJoinRoomComponent} from './components/modal-join-room/modal-join-room.component';
import {FormJoinRoomComponent} from './components/form-join-room/form-join-room.component';


@NgModule({
  declarations: [
    MainComponent,
    WelcomeComponent,
    AboutComponent,
    FormJoinRoomComponent,
    ModalJoinRoomComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MainRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class MainModule {
}
