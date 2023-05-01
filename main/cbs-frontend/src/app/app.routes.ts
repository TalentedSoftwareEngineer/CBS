export const ROUTES = {
  login: '/authenticate',
  dashboard: {
    system_overview: '/service/system_overview',
    billing_overview: '/service/billing_overview',
    client_activities: '/service/client_activities',
    short_cuts: '/service/short_cuts',
  },
  administration: {
    account: 'account',
    logo: 'logo',
    banner: 'banner',
    lerg: 'lerg',
    lrn: 'lrn'
  },
  client_mng: {
    customer: 'manage_customer',
    customer_edit: '/service/customer_edit',
    roles: 'manage_roles',
    user: 'manage_user',
  },
  vendor_mng: {
    vendor: 'manage_vendor',
    vendor_edit: '/service/vendor_edit',
    vendor_rates: 'vendor_rates',
    vendor_rate_comparison: 'vendor_rate_comparison',
  },
  number_mng: {
    buy_number: 'buy_number',
    customer_number: 'customer_number',
    tfn_number: 'tfn_number_management',
    did_number: 'did_number_management',
  },
  reports: {
    cdrs_import: 'cdrs_import',
    cdr_import_history: 'cdr_import_history',
    cdr_log: 'cdr_log',
  }
}
