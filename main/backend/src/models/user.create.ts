import {User} from "./user.model";
import {UserInfo} from "./user-info.model";

export class UserCreateRequest {
    username: string;
    email: string;

    first_name: string;
    last_name: string;

    timezone?: string;

    customer_id: number;
    role_id: number;

    password: string;

    country?: string;
    address?: string;
    province?: string;
    city?: string;
    zip_code?: string;
    tel1?: string;
    tel2?: string;
    mobile?: string;
    fax?: string;

    constructor() {
    }
}