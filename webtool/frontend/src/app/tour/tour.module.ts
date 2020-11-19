import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {TourListComponent} from './tour-list/tour-list.component';
import {TourDetailComponent} from './tour-detail/tour-detail.component';
import {CoreModule} from '../core/core.module';
import {ReactiveFormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {DropdownModule, TabMenuModule} from 'primeng/primeng';

const routes: Routes = [
  {path: ':id', component: TourDetailComponent},
  {path: '', component: TourListComponent, pathMatch: 'full'}
];

@NgModule({
  declarations: [TourListComponent, TourDetailComponent],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    TableModule,
    TabMenuModule,
    DropdownModule
  ]
})
export class TourModule {
}
