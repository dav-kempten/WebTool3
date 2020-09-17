import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {SessionListComponent} from './session-list/session-list.component';
import {SessionDetailComponent} from './session-detail/session-detail.component';
import {CoreModule} from '../core/core.module';
import {ReactiveFormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {TabMenuModule} from 'primeng/primeng';

const routes: Routes = [
  {path: ':id', component: SessionDetailComponent},
  {path: '', component: SessionListComponent, pathMatch: 'full'}
];

@NgModule({
  declarations: [SessionListComponent, SessionDetailComponent],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    TableModule,
    TabMenuModule
  ],
})
export class SessionModule {
}
