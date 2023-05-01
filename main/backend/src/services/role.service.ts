import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {PrivilegeRepository, RoleRepository} from '../repositories';
import {DEFAULT_ROLES} from '../constants/configurations';
import {HttpErrors} from '@loopback/rest';
import {Customer, Role} from '../models';

@injectable({scope: BindingScope.TRANSIENT})
export class RoleService {
  constructor(
    @repository(RoleRepository)
    public roleRepository : RoleRepository,

    @repository(PrivilegeRepository)
    public privilegeRepository : PrivilegeRepository,
  ) {}

  async createDefaultRoles(customer: Customer) {
    // get default admin and user role
    const admin = await this.roleRepository.findOne({where: {name: DEFAULT_ROLES.COMPANY_ADMIN}})
    const user = await this.roleRepository.findOne({where: {name: DEFAULT_ROLES.COMPANY_USER}})

    if (admin == null || user == null)
      throw new HttpErrors.BadRequest("Default Company Admin or Company User role is not existed. Please try again later.")

    // get admin and user role privileges
    let adminPrivileges = await this.roleRepository.getPermissions(admin.id!)
    let userPrivileges = await this.roleRepository.getPermissions(user.id!)

    if (adminPrivileges == null || userPrivileges == null)
      throw new HttpErrors.BadRequest("Default Company Admin or Company User role is not existed. Please try again later.")

    // create company admin and user role
    await this.createRole(customer, "Admin", adminPrivileges)
    await this.createRole(customer, "User", userPrivileges)
  }

  private async createRole(customer: Customer, type: string, privileges: number[]) {
    let role = await this.roleRepository.findOne({where: {name: customer.company_id.toUpperCase() + " " + type}})
    if (role) {

    } else {
      role = new Role()
      role.name = customer.company_id.toUpperCase() + " " + type
      role.description = type + " for " + customer.company_name
      role.created_by = customer.created_by
      role.updated_by = customer.created_by
      role.created_at = new Date().toISOString()
      role.updated_at = new Date().toISOString()
      role = await this.roleRepository.create(role)

      for (const item of privileges) {
        await this.roleRepository.rolePrivileges(role.id).create({privilege_id: item})
      }
    }
  }

}
