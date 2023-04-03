import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {StoreService} from "../store/store.service";
import {HttpClient} from "@angular/common/http";
import {IAuditionedUser, IPrivilege, IRole, IUser, IUserLogin, IUserToken} from "../../models/user";
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
      u.uiSettings = "{}";
      u.permissions = user.permissions;
      this.store.storeUser(u);
    }));
  }

  getCurrentUser(): Observable<IUser> {
    const url = `${this.coreApi}/authorization`;
    return this.http.get<IUser>(url);
  }

  //Logo Banner Management
  getLogoBannerConfigurations(): Observable<any> {
    const url = `${this.coreApi}/configurations/initSettings`;
    return this.http.get<any>(url);
  }

  setLogo(data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/configurations/logo`, data);
  }

  setBanner(data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/configurations/banner`, data);
  }

  //Privileges APIs
  getPrivilegesList(): Observable<IPrivilege[]> {
    const url = `${this.coreApi}/privileges`;
    return this.http.get<IPrivilege[]>(url);
  }

  getPrivilege(id: number): Observable<IPrivilege> {
    const url = `${this.coreApi}/privileges/${id}`;
    return this.http.get<IPrivilege>(url);
  }


  //Roles APIs
  getRolesList(active: string, direction: string, page: number, size: number, filterValue: string): Observable<IRole[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`
    }).toString();
    const url = `${this.coreApi}/roles?${parametersQuery}`;
    return this.http.get<IRole[]>(url);
  }

  getRolesListForFilter(): Observable<IRole[]> {
    const url = `${this.coreApi}/roles/for_filter`;
    return this.http.get<IRole[]>(url);
  }

  getRoleCount(filterValue: string, customerFilter?: any): Observable<any> {
    // const whereParam = getCountWhere(filterValue, '', '', ['name','description'], customerFilter);
    // return this.http.get<any>(`${this.coreApi}/roles/count?${'where=' + whereParam}`);
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`
    }).toString();
    return this.http.get<any>(`${this.coreApi}/roles/count?${parametersQuery}`);
  }

  createRole(data: any): Observable<IRole> {
    return this.http.post<IRole>(`${this.coreApi}/roles`, data);
  }

  getRole(id: number): Observable<IRole> {
    const url = `${this.coreApi}/roles/${id}`;
    return this.http.get<IRole>(url);
  }

  updateRole(id: number, data: any): Observable<IRole> {
    return this.http.patch<IRole>(`${this.coreApi}/roles/${id}`, data);
  }

  deleteRoleById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/roles/${id}`);
  }

  //Customers APIs
  getCustomersList(active: string, direction: string, page: number, size: number, filterValue: string): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`
    }).toString();
    const url = `${this.coreApi}/customers?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getCustomersCount(filterValue: string, customerFilter?: any): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`
    }).toString();
    return this.http.get<any>(`${this.coreApi}/customers/count?${parametersQuery}`);
  }

  getCustomerListForFilter(): Observable<any[]> {
    const url = `${this.coreApi}/customers/for_filter`;
    return this.http.get<any[]>(url);
  }

  createCustomer(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/customers`, data);
  }

  setCustomerRoles(id: number): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/customers/${id}/roles`, {});
  }

  getCustomer(id: number): Observable<any> {
    const url = `${this.coreApi}/customers/${id}`;
    return this.http.get<any>(url);
  }

  updateCompany(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/customers/${id}/general`, data);
  }

  updateCredential(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/customers/${id}/password`, data);
  }

  updateBilling(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/customers/${id}/billing`, data);
  }

  updateAdditional(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/customers/${id}/additional`, data);
  }

  deleteCustomerById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/customers/${id}`);
  }

  //Users APIs
  getUsersList(active: string, direction: string, page: number, size: number, filterValue: string, roleIdFilterValue: any, statusFilterValue: any): Observable<IUser[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`,
      roleFilterId: `${roleIdFilterValue}`,
      statusFilter: `${statusFilterValue}`,
    }).toString();
    const url = `${this.coreApi}/users?${parametersQuery}`;
    return this.http.get<IUser[]>(url);
  }

  getUserCount(filterValue: string, roleIdFilterValue: any, statusFilterValue: any): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`,
      roleFilterId: `${roleIdFilterValue}`,
      statusFilter: `${statusFilterValue}`,
    }).toString();
    return this.http.get<any>(`${this.coreApi}/users/count?${parametersQuery}`);
  }

  getUser(id: number): Observable<IUser> {
    const url = `${this.coreApi}/users/${id}`;
    return this.http.get<IUser>(url);
  }

  getUsersListForFilter(): Observable<IUser[]> {
    const url = `${this.coreApi}/users/for_filter`;
    return this.http.get<IUser[]>(url);
  }

  createUser(data: any): Observable<IUser> {
    return this.http.post<IUser>(`${this.coreApi}/users`, data);
  }


  getAuditionedUsername(id: number): Observable<IAuditionedUser> {
    const url = `${this.coreApi}/users/${id}/auditioned`;
    return this.http.get<IAuditionedUser>(url);
  }

  updateUserMain(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/users/${id}/primary`, data);
  }

  updateUserPassword(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/users/${id}/password`, data);
  }

  updateUserAdditional(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/users/${id}/additional`, data);
  }

  updateUserUISettings(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/users/${id}/ui_settings`, data);
  }

  updateUserStatus(id: number): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/users/${id}/status`, {});
  }

  deleteUserById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/users/${id}`);
  }

  //Resourse Group
  getGroupsList(active: string, direction: string, page: number, size: number, filterValue: string, directionFilter: any, activeFilter: any, id: number): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`,
      directionFilter: `${directionFilter}`,
      activeFilter: `${activeFilter}`,
    }).toString();
    const url = `${this.coreApi}/customers/${id}/rg?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getGroupsCount(filterValue: string, directionFilter: any, activeFilter: any, id: number): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`,
      directionFilter: `${directionFilter}`,
      activeFilter: `${activeFilter}`,
    }).toString();
    return this.http.get<any>(`${this.coreApi}/customers/${id}/rg/count?${parametersQuery}`);
  }

  createResourceGroup(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/customers/${id}/rg`, data);
  }

  getResourceGroup(id: string): Observable<any> {
    const url = `${this.coreApi}/customers/rg/${id}`;
    return this.http.get<any>(url);
  }

  updateResourceGroup(id: string, data: any): Observable<any> {
    const url = `${this.coreApi}/customers/rg/${id}`;
    return this.http.patch<any>(url, data);
  }

  deleteResourceGroup(id: string): Observable<any> {
    const url = `${this.coreApi}/customers/rg/${id}`;
    return this.http.delete<any>(url);
  }

  uploadResourceGroup(id: any, data: any): Observable<any> {
    const url = `${this.coreApi}/customers/${id}/rg/upload`;
    return this.http.post<any>(url, data);
  }

  //Customer Rates
  getRatesList(active: string, direction: string, page: number, size: number, filterValue: string, id: number): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`
    }).toString();
    const url = `${this.coreApi}/customers/${id}/rates?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getRatesCount(filterValue: string, id: number): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`
    }).toString();
    return this.http.get<any>(`${this.coreApi}/customers/${id}/rates/count?${parametersQuery}`);
  }

  createRate(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/customers/${id}/rates`, data);
  }

  getRate(id: string): Observable<any> {
    const url = `${this.coreApi}/customers/rates/${id}`;
    return this.http.get<any>(url);
  }

  getRateDefault(id: number): Observable<any> {
    const url = `${this.coreApi}/customers/${id}/rates/default`;
    return this.http.get<any>(url);
  }

  updateRate(id: string, data: any): Observable<any> {
    const url = `${this.coreApi}/customers/rates/${id}`;
    return this.http.patch<any>(url, data);
  }

  deleteRate(id: string): Observable<any> {
    const url = `${this.coreApi}/customers/rates/${id}`;
    return this.http.delete<any>(url);
  }

  uploadRate(id: any, data: any): Observable<any> {
    const url = `${this.coreApi}/customers/${id}/rates/upload`;
    return this.http.post<any>(url, data);
  }

  //NpaNxx
  getNpanxxList(active: string, direction: string, page: number, size: number, filterValue: string): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`
    }).toString();
    const url = `${this.coreApi}/lergs?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getNpanxxCount(filterValue: string): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`
    }).toString();
    return this.http.get<any>(`${this.coreApi}/lergs/count?${parametersQuery}`);
  }

  getLergsRatesList(active: string, direction: string, page: number, size: number, filterValue: string): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`
    }).toString();
    const url = `${this.coreApi}/lergs/rates?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getLergsRatesCount(filterValue: string): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`
    }).toString();
    return this.http.get<any>(`${this.coreApi}/lergs/rates_count?${parametersQuery}`);
  }

  createNPANXX(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/lergs`, data);
  }

  getNPANXX(id: string): Observable<any> {
    const url = `${this.coreApi}/lergs/${id}`;
    return this.http.get<any>(url);
  }

  deleteNPANXXById(id: string): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/lergs/${id}`);
  }

  updateNPANXX(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/lergs/${id}`, data);
  }

  uploadNPANXX(data: any): Observable<any> {
    const url = `${this.coreApi}/lergs/upload`;
    return this.http.post<any>(url, data);
  }

  //Vendors APIs
  getVendorsList(active: string, direction: string, page: number, size: number, filterValue: string): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`
    }).toString();
    const url = `${this.coreApi}/vendors?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getVendorsCount(filterValue: string, VendorFilter?: any): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`
    }).toString();
    return this.http.get<any>(`${this.coreApi}/vendors/count?${parametersQuery}`);
  }

  getVendorListForFilter(): Observable<any[]> {
    const url = `${this.coreApi}/vendors/for_filter`;
    return this.http.get<any[]>(url);
  }

  createVendor(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/vendors`, data);
  }

  setVendorRoles(id: number): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/vendors/${id}/roles`, {});
  }

  getVendor(id: number): Observable<any> {
    const url = `${this.coreApi}/vendors/${id}`;
    return this.http.get<any>(url);
  }

  deleteVendorById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/vendors/${id}`);
  }

  updateVendorCompany(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/vendors/${id}/general`, data);
  }

  updateVendorCredential(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/vendors/${id}/password`, data);
  }

  updateVendorBilling(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/vendors/${id}/billing`, data);
  }

  updateVendorAdditional(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/vendors/${id}/additional`, data);
  }
  
  //Vendor Resourse Group
  getVendorGroupsList(active: string, direction: string, page: number, size: number, filterValue: string, directionFilter: any, activeFilter: any, id: number): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`,
      directionFilter: `${directionFilter}`,
      activeFilter: `${activeFilter}`,
    }).toString();
    const url = `${this.coreApi}/vendors/${id}/rg?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getVendorGroupsCount(filterValue: string, directionFilter: any, activeFilter: any, id: number): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`,
      directionFilter: `${directionFilter}`,
      activeFilter: `${activeFilter}`,
    }).toString();
    return this.http.get<any>(`${this.coreApi}/vendors/${id}/rg/count?${parametersQuery}`);
  }

  createVendorResourceGroup(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/vendors/${id}/rg`, data);
  }

  getVendorResourceGroup(id: string): Observable<any> {
    const url = `${this.coreApi}/vendors/rg/${id}`;
    return this.http.get<any>(url);
  }

  updateVendorResourceGroup(id: string, data: any): Observable<any> {
    const url = `${this.coreApi}/vendors/rg/${id}`;
    return this.http.patch<any>(url, data);
  }

  deleteVendorResourceGroup(id: string): Observable<any> {
    const url = `${this.coreApi}/vendors/rg/${id}`;
    return this.http.delete<any>(url);
  }

  uploadVendorResourceGroup(id: any, data: any): Observable<any> {
    const url = `${this.coreApi}/vendors/${id}/rg/upload`;
    return this.http.post<any>(url, data);
  }

  //Vendor Rates
  getVendorRatesList(active: string, direction: string, page: number, size: number, filterValue: string, id: number): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`
    }).toString();
    const url = `${this.coreApi}/vendors/${id}/rates?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getVendorRatesCount(filterValue: string, id: number): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`
    }).toString();
    return this.http.get<any>(`${this.coreApi}/vendors/${id}/rates/count?${parametersQuery}`);
  }

  createVendorRate(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/vendors/${id}/rates`, data);
  }

  getVendorRate(id: string): Observable<any> {
    const url = `${this.coreApi}/vendors/rates/${id}`;
    return this.http.get<any>(url);
  }

  getVendorRateDefault(id: number): Observable<any> {
    const url = `${this.coreApi}/vendors/${id}/rates/default`;
    return this.http.get<any>(url);
  }

  updateVendorRate(id: string, data: any): Observable<any> {
    const url = `${this.coreApi}/vendors/rates/${id}`;
    return this.http.patch<any>(url, data);
  }

  deleteVendorRate(id: string): Observable<any> {
    const url = `${this.coreApi}/vendors/rates/${id}`;
    return this.http.delete<any>(url);
  }

  uploadVendorRate(id: any, data: any): Observable<any> {
    const url = `${this.coreApi}/vendors/${id}/rates/upload`;
    return this.http.post<any>(url, data);
  }

  //CDRs Import
  getImportCDRsList(active: string, direction: string, page: number, size: number, filterValue: string): Observable<any[]> {
    const parametersQuery = new URLSearchParams({
      limit: `${size}`,
      skip: `${(page - 1) * size}`,
      order: `${active} ${direction}`,
      value: `${filterValue}`
    }).toString();
    const url = `${this.coreApi}/lergs?${parametersQuery}`;
    return this.http.get<any[]>(url);
  }

  getImportCDRsCount(filterValue: string): Observable<any> {
    const parametersQuery = new URLSearchParams({
      value: `${filterValue}`
    }).toString();
    return this.http.get<any>(`${this.coreApi}/lergs/count?${parametersQuery}`);
  }

  createImportCDR(data: any): Observable<any> {
    return this.http.post<any>(`${this.coreApi}/lergs`, data);
  }

  getImportCDR(id: string): Observable<any> {
    const url = `${this.coreApi}/lergs/${id}`;
    return this.http.get<any>(url);
  }

  deleteImportCDRById(id: string): Observable<any> {
    return this.http.delete<any>(`${this.coreApi}/lergs/${id}`);
  }

  updateImportCDR(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.coreApi}/lergs/${id}`, data);
  }

  uploadImportCDR(data: any): Observable<any> {
    const url = `${this.coreApi}/lergs/upload`;
    return this.http.post<any>(url, data);
  }
}
