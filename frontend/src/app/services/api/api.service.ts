import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {StoreService} from "../store/store.service";
import {HttpClient} from "@angular/common/http";
import {IUser, IUserLogin, IUserToken} from "../../models/user";
import {Observable} from "rxjs";
import {map, tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private coreApi: string;

  constructor(private http: HttpClient, private store: StoreService) {
    this.coreApi = environment.base_uri;
  }

  public login(data: IUserLogin, rememberedIf: boolean): Observable<object> {
    return this.http.post<IUserToken>(`${this.coreApi}/authenticate`, data).pipe(
      tap(token => this.store.storeToken({ ...token, rememberedIf })),
      map(token => token)
    );
  }

  public logout(): Observable<any> {
    return this.http.post(`${this.coreApi}/de-authorization`, null);
  }

  public retrieveLoggedUserOb(token: IUserToken): Observable<IUser> {
    return this.getCurrentUser().pipe(tap(user => {
      // @ts-ignore
      const u = user.user;
      u.company = user.company;
      u.somos = user.somos;
      u.uiSettings = "{}";
      u.permissions = user.permissions;
      this.store.storeUser(u);
    }));
  }

  getCurrentUser(): Observable<IUser> {
    const url = `${this.coreApi}/authorization`;
    return this.http.get<IUser>(url);
  }

  updateUserUISettings(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/users/${id}/ui_settings`, data);
  }

}
