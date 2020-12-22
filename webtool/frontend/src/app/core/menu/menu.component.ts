import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {MenuItem, MessageService, TreeNode} from 'primeng/api';
import {NavigationExtras, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ANONYMOUS_USER, AuthService, User} from '../service/auth.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';

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
export class MenuComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();

  memberForm: FormGroup = this.fb.group({memberId: ['', Validators.required]});
  userForm = this.fb.group({
      userName: ['', Validators.required],
      password: ['', Validators.required]
  });

  user: User;
  isLoggedIn: boolean;
  isLoggedOut: boolean;

  label: string;
  items: TreeNode[];
  selectedItem: TreeNode;

  buttonItems: MenuItem[];

  displayMenu: boolean;
  displayMemberLogin: boolean;
  displayUserLogin: boolean;

  loginMember() {
    const value = this.memberForm.value;
    if (value.memberId) {
      this.userService.login('', '', value.memberId)
        .subscribe( user => {
          const loginBox = document.getElementById('memberId');
          if (!!Object.keys(user).length) {
            this.displayMemberLogin = false;
            loginBox.style.backgroundColor = 'white';
          } else {
            loginBox.style.backgroundColor = '#ff8080';
          }
        });
    }
  }

  loginUser() {
    const value = this.userForm.value;
    if (value.userName && value.password) {
      this.userService.login(value.userName, value.password, '')
        .subscribe( user => {
          const userBox = document.getElementById('userName');
          const passwordBox = document.getElementById('password');
          if (!!Object.keys(user).length) {
            this.displayUserLogin = false;
            userBox.style.backgroundColor = 'white';
            passwordBox.style.backgroundColor = 'white';
          } else {
            userBox.style.backgroundColor = '#ff8080';
            passwordBox.style.backgroundColor = '#ff8080';
          }
        });
    }
  }

  loginButtonHandler() {
    if (this.isLoggedOut) {
      this.displayMemberLogin = true;
    }
    if (this.isLoggedIn) {
      this.userService.logout();
      void this.router.navigate(['/dashboard']);
    }
  }

  nodeSelect(event) {
    const node: TreeNode = event.node;
    const link: MenuData = node.data;

    this.displayMenu = false;
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
    // this.messageService.add({severity: 'success', summary: 'Node Selected', detail: event.node.label});
  }

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private messageService: MessageService,
    private fb: FormBuilder,
    private userService: AuthService) {}

  ngOnInit() {

    this.buttonItems = [
      {
        icon: 'pi pi-user',
        visible: false,
        command: () => void this.router.navigate([`/trainers/${this.user.id}`])
      },
      {
        label: 'Service Zugang', icon: 'pi pi-lock',
        command: () => this.displayUserLogin = true
      }
    ];

    this.items = [
      {label: 'Dashboard', icon: 'pi pi-home', data: {routerLink: '/dashboard'}},
      /* {label: 'Trainer', icon: 'pi pi-user', data: {routerLink: '/trainers'}}, */
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
      {label: 'Gruppen', icon: 'pi pi-users', data: {routerLink: '/sessions'}, /* children: [
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
        ] */}
    ];

    this.userService.user$.pipe(
      takeUntil(this.destroySubject),
      filter(user => !!user)
    ).subscribe(user => {
      if (user !== ANONYMOUS_USER) {
        this.user = user;
        this.buttonItems[0].label = `${user.firstName} ${user.lastName}`;
        this.buttonItems[0].visible = true;
        this.buttonItems[0].disabled = false;
        this.buttonItems[1].visible = false;
        this.label = 'Abmelden';
        this.isLoggedIn = true;
        this.isLoggedOut = false;
      } else {
        this.buttonItems[0].label = '';
        this.buttonItems[0].visible = false;
        this.buttonItems[0].disabled = true;
        this.buttonItems[1].visible = true;
        this.label = 'Anmelden';
        this.isLoggedIn = false;
        this.isLoggedOut = true;
      }
    });

  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }
}
