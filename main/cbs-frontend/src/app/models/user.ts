export interface IUserLogin {
  username: string;
  password: string;
}

export interface IUserToken {
  token: string;
  user_id: number;
  rememberedIf: boolean;
}


export interface IRole {
  id: number,
  name: string,
  description: string,
  created: any,
  updated: any,
  created_at: any,
  updated_at: any,
  created_by: any,
  updated_by: any,
  rolePrivileges?: IRolePrivileges[],
}


export interface IPrivilege {
  id: number,
  name: string,
  is_single: number | boolean,
}

export interface IRolePrivileges {
  id: string,
  role_id: number,
  privilege_id: number
}

export interface IUser {
  id: number;
  type?: string
  role_id: number;
  role?: IRole,
  username: string,
  password?: string,
  email: string,
  first_name: string,
  last_name: string,
  status: boolean,
  permissions?: number[],
  customerId: number,
  customer: ICustomer,
  customer_id: number,
  created_at: any,
  updated_at: any,
  created_by: any,
  updated_by: any,
  userInfo?: IUserInfo,
  ui_settings: any,
  timezone: any
}

export interface IAuditionedUser {
  username: string,
  email: string,
  irst_name: string,
  last_name: string
}

export interface ICustomer {
  id: number,
  company_id: string,
  company_name: string,
  billing_email: string,
  address: string,
  city: string,
  state: string,
  country: string,
  zip: string,
  phone: string,
  ssn: string,
  first_name: string,
  last_name: string,
  email: string,
  settings: string,
  created_at: any,
  updated_at: any,
  created_by: any,
  updated_by: any,
  created:	any,
  updated:	any
}

export interface IUserInfo {
  id: number,
  country: string,
  address: string,
  province: string,
  city: string,
  zip_code: string,
  tel1: string,
  tel2: string,
  mobile: string,
  fax: string,
  contact_name: string,
  contact_number: string,
  created_at: string,
  updated_at: string,
  created_by: number,
  updated_by: number
}

export interface ICompany {
  id: number,
  name: string,
  code?: string,
  resp_org_id?: string,
  role_code?: string,
  company_email?: string,
  address?: string,
  city?: string,
  state?: string,
  zip_code?: string,
  first_name?: string,
  last_name?: string,
  contact_email?: string,
  contact_phone?: string,
  ro_id?: string,
  status: boolean,
  created_at: any,
  updated_at: any,
  created_by: any,
  updated_by: any
}

export interface ISomosUser {
  id: number,
  username: string,
  password?: string,
  client_key?: string,
  client_password?: string,
  created_at: any,
  updated_at: any,
  created_by: any,
  updated_by: any
}

export interface ILogoBanner {
  logo: string,
  banner: string
}
