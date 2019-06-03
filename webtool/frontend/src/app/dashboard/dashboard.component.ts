import {Component, OnInit} from '@angular/core';
import {AuthService, User} from '../core/service/auth.service';
import {Observable} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {map} from 'rxjs/operators';

@Component({
  selector: 'avk-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  userForm: FormGroup;
  memberForm: FormGroup;

  user$: Observable<User>;
  isLoggedIn$: Observable<boolean>;
  isLoggedOut$: Observable<boolean>;

  constructor(private fb: FormBuilder, private userService: AuthService) {
    this.userForm = this.fb.group({
      userName: ['Rambo-Selcher', Validators.required],
      password: ['12345678', Validators.required]
    });

    this.memberForm = this.fb.group({
      memberId: '008-00-123456'
    });
  }

  ngOnInit() {
    this.user$ = this.userService.user$;
    this.isLoggedIn$ = this.userService.isLoggedIn$;
    this.isLoggedOut$ = this.userService.isLoggedOut$;
  }

  userLogin() {
    const value = this.userForm.value;
    if (value.userName && value.password) {
      this.userService.userLogin(value.userName, value.password)
        .subscribe( user => { if (!!user) {console.log(`User ${user.firstName} ${user.lastName} is logged in`); }});
    }
  }

  memberLogin() {
    const value = this.memberForm.value;
    if (value.memberId) {
      this.userService.memberLogin(value.memberId)
        .subscribe( user => console.log(`Member ${user.firstName} ${user.lastName} is logged in`));
    }
  }

  logout() {
    this.user$.pipe(
      map(user => user.role)
    ).subscribe( role => console.log(`${role} is logged out`)).unsubscribe();
    this.userService.logout();
  }
}
