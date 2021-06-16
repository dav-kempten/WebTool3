import {BehaviorSubject, Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {catchError, filter, first, map, publishReplay, refCount, tap} from 'rxjs/operators';
import {User as RawUser} from '../../model/user';
import {Permission, PermissionService} from './permission.service';

export const enum Role {
  administrator = 'Administrator',
  staff = 'Geschäftsstelle',
  coordinator = 'Fachbereichssprecher',
  guide = 'Trainer'
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: Role;
}

export const ANONYMOUS_USER: User = {
  id: undefined,
  firstName: '',
  lastName: '',
  role: undefined
};


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  etag: string;

  private subject = new BehaviorSubject<User>(ANONYMOUS_USER);

  user$: Observable<User> = this.subject.asObservable().pipe(filter(user => !!user));
  isLoggedIn$: Observable<boolean> = this.user$.pipe(map((user: User): boolean => !!user.id));
  isLoggedOut$: Observable<boolean> = this.isLoggedIn$.pipe(map(isLoggedIn => !isLoggedIn));
  isAdministrator$: Observable<boolean> = this.user$.pipe(map(user => user.role === Role.administrator));
  isStaff$: Observable<boolean> = this.user$.pipe(map(user => user.role === Role.staff));
  isCoordinator$: Observable<boolean> = this.user$.pipe(map(user => user.role === Role.coordinator));
  isGuide$: Observable<boolean> = this.user$.pipe(map(user => user.role === Role.guide));
  guideId$: Observable<number> = this.user$.pipe(map(user => user.id));
  guidePermission$: Observable<Permission> = this.user$.pipe(map(user => {
    return {permissionLevel: this.permission.convertRole(user.role), guideId: user.id};
  }));

  constructor(private http: HttpClient, private permission: PermissionService) {}

  login(userName: string = '', password: string = '', memberId: string = ''): Observable<User> {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    const user = this.http.post<User>(
      '/api/login/',
      {member_id: memberId, username: userName, password},
      httpOptions
    );

    return user.pipe(
      catchError((error: HttpErrorResponse): Observable<User> => {
        console.log(error.statusText, error.status);
        return of({} as User);
      }),
      tap(rawUser => {
        /* Set timeout for several automatic requests, make them slower */
        setTimeout(() => {
          if (!!Object.keys(rawUser).length) {
            this.subject.next(convertUser(rawUser));
          } else {
            this.subject.next(ANONYMOUS_USER);
          }
        }, 500);
      }),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );
  }

  logout(): void {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    this.http.post<void>(
      '/api/logout/',
      {},
      httpOptions
    ).pipe(
      first()
    ).subscribe(() => this.subject.next(ANONYMOUS_USER));

  }
}

function convertRole(role: string): Role {
  switch (role) {
    case 'guide': return Role.guide;
    case 'staff': return Role.staff;
    case 'coordinator': return Role.coordinator;
    case 'administrator': return Role.administrator;
  }
}

function convertUser(user: RawUser): User {
  return {
    ... user,
    role: convertRole(user.role)
  };
}
