export interface IUserLogin {
  username: string;
  password: string;
}

export interface IUserToken {
  token: string;
  user_id: number;
  rememberedIf: boolean;
}

export interface IUser {
  id: number;
  role_id: number;

  company?: ICompany,
  somos?: ISomosUser,

  username: string,
  password: string,

  email: string,
  first_name: string,
  last_name: string,
  ro: string,
  status: boolean,

  permissions?: number[],
  ui_settings: string;
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
}

export interface ISomosUser {
  id: number,
  username: string,
  password?: string,
  client_key?: string,
  client_password?: string,
}
