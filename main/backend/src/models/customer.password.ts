export class CustomerPasswordUpdateRequest {
  username?: string;
  allowed: boolean;
  new_password?: string;
  confirm_password?: string;

  constructor() {
  }
}
