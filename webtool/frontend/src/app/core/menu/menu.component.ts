import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {MenuItem, MessageService, TreeNode} from 'primeng/api';
import {NavigationExtras, Router} from '@angular/router';

interface MenuData {
  routerLink: string;
  queryParams?: {[key: string]: string};
  fragment?: string;
}

@Component({
  selector: 'avk-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  providers: [MessageService]
})
export class MenuComponent implements OnInit {

  label = 'Anmelden';
  display: boolean;
  items: TreeNode[];
  selectedItem: TreeNode;

  buttonItems: MenuItem[];

  userLogin() {
    if (this.label === 'Anmelden') {
      this.label = 'Abmelden';
      this.buttonItems[0].label = 'Wolfgang Doll';
      this.buttonItems[0].visible = true;
      this.buttonItems[0].disabled = false;
      this.buttonItems[1].visible = false;
    } else {
      this.label = 'Anmelden';
      this.buttonItems[0].label = '';
      this.buttonItems[0].visible = false;
      this.buttonItems[1].visible = true;
      void this.router.navigate(['/dashboard']);
    }
  }

  nodeSelect(event) {
    const node: TreeNode = event.node;
    const link: MenuData = node.data;

    this.display = false;
    this.selectedItem = null;

    if (link && link.routerLink) {
      if (link.fragment) {
        const navigationExtras: NavigationExtras = {
          fragment: link.fragment
        };
        void this.router.navigate([link.routerLink], navigationExtras);
      } else {
        if (link.queryParams) {
          const navigationExtras: NavigationExtras = {
            queryParams: link.queryParams
          };
          void this.router.navigate([link.routerLink], navigationExtras);
        } else {
          void this.router.navigate([link.routerLink]);
        }
      }
    }
    this.messageService.add({severity: 'success', summary: 'Node Selected', detail: event.node.label});
  }

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private messageService: MessageService) {}

  ngOnInit() {
    this.buttonItems = [
      {
        icon: 'pi pi-user',
        visible: false,
        command: () => void this.router.navigate(['/trainers/22'])
      },
      {
        label: 'Service Zugang', icon: 'pi pi-lock', command: () => {
          this.label = 'Abmelden';
          this.buttonItems[0].label = 'Steffi';
          this.buttonItems[0].visible = true;
          this.buttonItems[0].disabled = true;
          this.buttonItems[1].visible = false;
        }
      }
    ];

    this.items = [
      {label: 'Dashboard', icon: 'pi pi-home', data: {routerLink: '/dashboard'}},
      {label: 'Trainer', icon: 'pi pi-user', data: {routerLink: '/trainers'}},
      {label: 'Kurse', icon: 'pi pi-comments', data: {routerLink: '/instructions'}, children: [
        {label: 'Winter', icon: 'pi pi-comments', data: {routerLink: '/instructions', fragment: 'winter'}},
        {label: 'Sommer', icon: 'pi pi-comments', data: {routerLink: '/instructions', fragment: 'summer'}},
        {label: 'Indoor', icon: 'pi pi-comments', data: {routerLink: '/instructions', fragment: 'indoor'}},
        ]},
      {label: 'Touren', icon: 'pi pi-globe', data: {routerLink: '/tours'}, children: [
        {label: 'Winter', icon: 'pi pi-globe', data: {routerLink: '/tours', fragment: 'winter'}},
        {label: 'Sommer', icon: 'pi pi-globe', data: {routerLink: '/tours', fragment: 'summer'}},
        {label: 'Jugend', icon: 'pi pi-globe', data: {routerLink: '/tours', fragment: 'youth'}},
        ]},
      {label: 'Gruppen', icon: 'pi pi-users', data: {routerLink: '/sessions'}, children: [
        {label: 'Obergünzburg', icon: 'pi pi-users', data: {routerLink: '/sessions', queryParams: {g: 'OGG'}}, children: [
          {label: 'Kinder', icon: 'pi pi-users', data: {routerLink: '/sessions', queryParams: {g: 'OGK'}}},
          {label: 'Jugend', icon: 'pi pi-users', data: {routerLink: '/sessions', queryParams: {g: 'OGJ'}}},
          {label: 'Senioren', icon: 'pi pi-users', data: {routerLink: '/sessions', queryParams: {g: 'OGS'}}},
          ]},
        {label: 'Kinder', icon: 'pi pi-users', data: {routerLink: '/sessions', queryParams: {g: 'GKD'}}},
        {label: 'Jugend', icon: 'pi pi-users', data: {routerLink: '/sessions', queryParams: {g: 'GJG'}}},
        {label: 'Erwachsene', icon: 'pi pi-users', data: {routerLink: '/sessions', queryParams: {g: 'GEW'}}},
        ]},
      {label: 'Events', icon: 'pi pi-bookmark', data: {routerLink: '/talks'}, children: [
        {label: 'Sektionsabend', icon: 'pi pi-bookmark', data: {routerLink: '/talks', queryParams: {g: 'SKA'}}},
        {label: 'Vollmond Stammtisch', icon: 'pi pi-bookmark', data: {routerLink: '/talks', queryParams: {g: 'VST'}}},
        {label: 'Abendschule', icon: 'pi pi-bookmark', data: {routerLink: '/talks', queryParams: {g: 'AAS'}}},
        {label: 'Radlrunde', icon: 'pi pi-bookmark', data: {routerLink: '/talks', queryParams: {g: 'GRR'}}},
        {label: 'Events', icon: 'pi pi-bookmark', data: {routerLink: '/talks', queryParams: {g: 'EVT'}}},
        ]}
    ];
  }

}
