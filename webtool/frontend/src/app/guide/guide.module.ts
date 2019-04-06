import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {GuideListComponent} from './guide-list/guide-list.component';
import {GuideDetailComponent} from './guide-detail/guide-detail.component';
import {CoreModule} from '../core/core.module';
import {NameListResolver} from '../core/store/name.resolver';
import {ReactiveFormsModule} from '@angular/forms';

const routes: Routes = [
  {path: ':id', component: GuideDetailComponent /* , resolve: {nameList: NameListResolver}*/ },
  {path: '', component: GuideListComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ],
  declarations: [GuideListComponent, GuideDetailComponent],
  exports: [],
})
export class GuideModule {}
