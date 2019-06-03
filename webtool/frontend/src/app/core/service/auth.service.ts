import {BehaviorSubject, Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {filter, map, shareReplay, tap} from 'rxjs/operators';
import {User as RawUser} from '../../model/user';

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

interface Users { [key: number]: RawUser; }

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

  constructor(private http: HttpClient) {}

  memberLogin(memberId: string): Observable<User> {
    const users = this.http.get<Users>('../../../assets/user-db.json').pipe(shareReplay());
    switch (memberId) {
      case '008-00-123456':
        return users.pipe(
          map<Users, User>(userDb => convertUser(userDb['1'])),
          tap(user => this.subject.next(user))
        );
      case '008-00-901234':
        return users.pipe(
          map<Users, User>(userDb => convertUser(userDb['3'])),
          tap(user => this.subject.next(user))
        );
    }
  }

  userLogin(userName: string, password: string): Observable<User> {
    const users = this.http.get<Users>('../../../assets/user-db.json').pipe(shareReplay());
    return users.pipe(
      map<Users, User>(userDb => {
        return Object.values(userDb).find(user => `${user.firstName}-${user.lastName}` === userName);
      }),
      tap(user => this.subject.next(user))
    );
  }

  logout(): void {
    this.subject.next(ANONYMOUS_USER);
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
