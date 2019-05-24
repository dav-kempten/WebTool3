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
import {reducer as ValueReducer} from './store/value.reducer';
import {NameListEffects} from './store/name.effects';
import {ValueEffects} from './store/value.effects';
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
import { MembernumberComponent } from './membernumber/membernumber.component';
import {DropdownModule, SpinnerModule} from 'primeng/primeng';
import {MultiSelectModule} from 'primeng/multiselect';
import { MultiselectComponent } from './multiselect/multiselect.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import {ToggleButtonModule} from 'primeng/togglebutton';

@NgModule({
  declarations: [
    GuideComponent, TeamComponent, DateComponent, TimeComponent, NamePipe, NamesPipe, MenuComponent,
    BreadcrumbComponent, DateRequiredDirective, GuideRequiredDirective, MembernumberComponent, DropdownComponent, 
	  MultiselectComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StoreModule.forFeature('nameList', NameListReducer),
    EffectsModule.forFeature([NameListEffects]),
    StoreModule.forFeature('values', ValueReducer),
    EffectsModule.forFeature([ValueEffects]),
    CalendarModule,
    AutoCompleteModule,
    ButtonModule,
    SplitButtonModule,
    SidebarModule,
    TreeModule,
    ScrollPanelModule,
    ToastModule,
    SpinnerModule,
    DropdownModule,
    MultiSelectModule,
    ButtonModule,
    ToggleButtonModule
  ],
  exports: [
    GuideComponent, TeamComponent, DateComponent, TimeComponent, NamePipe, NamesPipe, MenuComponent,
    BreadcrumbComponent, DateRequiredDirective, GuideRequiredDirective, MembernumberComponent, DropdownComponent, 
	  MultiselectComponent, ButtonModule, ToggleButtonModule
  ]
})
export class CoreModule { }
