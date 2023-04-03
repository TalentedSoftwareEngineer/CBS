import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CustomerRepository} from '../repositories';
import {RATE_TYPE} from '../constants/configurations';

@injectable({scope: BindingScope.TRANSIENT})
export class CustomerService {
  constructor(
    @repository(CustomerRepository) protected customerRepository: CustomerRepository,
  ) {}

  async getDefaultRates(customer_id: number) {
    const customer = await this.customerRepository.findById(customer_id)
    if (customer) {
      return {
        rate: customer.rate,
        init_duration: customer.init_duration,
        succ_duration: customer.succ_duration,
      }
    }

    return null
  }
}
