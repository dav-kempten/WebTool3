import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {ReactiveFormsModule} from '@angular/forms';
import {CalendarModule} from 'primeng/calendar';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {GuideComponent} from './guide/guide.component';
import {TeamComponent} from './team/team.component';
import {DateComponent} from './date/date.component';
import {TimeComponent} from './time/time.component';
import {reducer as NameListReducer} from './store/name.reducer';
import {NameListEffects} from './store/name.effects';
import {NamePipe, NamesPipe} from './store/name.pipe';
import {ButtonModule} from 'primeng/button';
import {SidebarModule} from 'primeng/sidebar';
import {TreeModule} from 'primeng/tree';
import {MenuComponent} from './menu/menu.component';
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {ToastModule} from 'primeng/toast';
import {SplitButtonModule} from 'primeng/splitbutton';
import {BreadcrumbComponent} from './breadcrumb/breadcrumb.component';
import {RequiredDirective as DateRequiredDirective} from './date/required.directive';
import {RequiredDirective as GuideRequiredDirective} from './guide/required.directive';
import { InputfieldComponent } from './inputfield/inputfield.component';

@NgModule({
  declarations: [
    GuideComponent, TeamComponent, DateComponent, TimeComponent, NamePipe, NamesPipe, MenuComponent,
    BreadcrumbComponent, DateRequiredDirective, GuideRequiredDirective, InputfieldComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StoreModule.forFeature('nameList', NameListReducer),
    EffectsModule.forFeature([NameListEffects]),
    CalendarModule,
    AutoCompleteModule,
    ButtonModule,
    SplitButtonModule,
    SidebarModule,
    TreeModule,
    ScrollPanelModule,
    ToastModule
  ],
  exports: [
    GuideComponent, TeamComponent, DateComponent, TimeComponent, NamePipe, NamesPipe, MenuComponent,
    BreadcrumbComponent, DateRequiredDirective, GuideRequiredDirective
  ]
})
export class CoreModule { }
