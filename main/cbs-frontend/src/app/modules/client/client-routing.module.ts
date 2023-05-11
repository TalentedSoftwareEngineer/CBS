import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountComponent } from './account/account.component';
import { AutoGenerateInvoiceComponent } from './auto-generate-invoice/auto-generate-invoice.component';
import { AutoGenerateStatementComponent } from './auto-generate-statement/auto-generate-statement.component';
import { BannerComponent } from './banner/banner.component';
import { BillingOverviewComponent } from './billing-overview/billing-overview.component';
import { BuyNumberComponent } from './buy-number/buy-number.component';
import { CdrImportHistoryComponent } from './cdr-import-history/cdr-import-history.component';
import { CdrLogComponent } from './cdr-log/cdr-log.component';
import { CdrsComponent } from './cdrs/cdrs.component';
import { ClientActivitiesComponent } from './client-activities/client-activities.component';
import { CreateBillingStatementComponent } from './create-billing-statement/create-billing-statement.component';
import { CustomerEditComponent } from './customer-edit/customer-edit.component';
import { CustomerNumberComponent } from './customer-number/customer-number.component';
import { CustomerPaymentComponent } from './customer-payment/customer-payment.component';
import {DashboardComponent} from "./dashboard/dashboard.component";
import { DidNumberManagementComponent } from './did-number-management/did-number-management.component';
import {LayoutComponent} from "./layout/layout.component";
import { LergComponent } from './lerg/lerg.component';
import { LogoComponent } from './logo/logo.component';
import { LrnComponent } from './lrn/lrn.component';
import { ManageCustomerComponent } from './manage-customer/manage-customer.component';
import { ManageRolesComponent } from './manage-roles/manage-roles.component';
import { ManageUserComponent } from './manage-user/manage-user.component';
import { ManageVendorComponent } from './manage-vendor/manage-vendor.component';
import { RerateCallsComponent } from './rerate-calls/rerate-calls.component';
import { ShortCutsComponent } from './short-cuts/short-cuts.component';
import { StatementAccountComponent } from './statement-account/statement-account.component';
import { TaxManagementComponent } from './tax-management/tax-management.component';
import { TfnNumberManagementComponent } from './tfn-number-management/tfn-number-management.component';
import { VendorEditComponent } from './vendor-edit/vendor-edit.component';
import { VendorRateComparisonComponent } from './vendor-rate-comparison/vendor-rate-comparison.component';
import { VendorRatesComponent } from './vendor-rates/vendor-rates.component';
import { ViewBillingStatementComponent } from './view-billing-statement/view-billing-statement.component';
import {CustomerAccountComponent} from "./customer-account/customer-account.component";

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    data: { title: '' },
    children: [
      {
        path: '',
        redirectTo: 'system_overview',
        pathMatch: 'full'
      },
      {
        path: 'system_overview',
        component: DashboardComponent,
        data: { title: 'Dashboard', guiSection: 'Dashboard'},
      },
      {
        path: 'billing_overview',
        component: BillingOverviewComponent,
        data: { title: 'Billing Overview', guiSection: 'Billing Overview'},
      },
      {
        path: 'client_activities',
        component: ClientActivitiesComponent,
        data: { title: 'Client Activities', guiSection: 'Client Activities'},
      },
      {
        path: 'short_cuts',
        component: ShortCutsComponent,
        data: { title: 'Short Cuts', guiSection: 'Short Cuts'},
      },
      {
        path: 'account',
        component: AccountComponent,
        data: { title: 'Account', guiSection: 'Account'},
      },
      {
        path: 'customer-account',
        component: CustomerAccountComponent,
        data: { title: 'Account', guiSection: 'Account'},
      },
      {
        path: 'logo',
        component: LogoComponent,
        data: { title: 'Logo Management', guiSection: 'Logo Management'},
      },
      {
        path: 'banner',
        component: BannerComponent,
        data: { title: 'Banner Management', guiSection: 'Banner Management'},
      },
      {
        path: 'lerg',
        component: LergComponent,
        data: { title: 'Lerg Management', guiSection: 'Lerg Management'},
      },
      {
        path: 'manage_customer',
        component: ManageCustomerComponent,
        data: {title: 'Manage Customer', guiSection: 'Manage Customer'},
      },
      {
        path: 'customer_edit',
        component: CustomerEditComponent,
        data: {title: 'Edit Customer', guiSection: 'Edit Customer'},
      },
      {
        path: 'manage_roles',
        component: ManageRolesComponent,
        data: {title: 'Manage Roles', guiSection: 'Manage Roles'},
      },
      {
        path: 'manage_user',
        component: ManageUserComponent,
        data: {title: 'Manage User', guiSection: 'Manage User'},
      },
      {
        path: 'manage_vendor',
        component: ManageVendorComponent,
        data: {title: 'Manage Vendor', guiSection: 'Manage Vendor'},
      },
      {
        path: 'vendor_edit',
        component: VendorEditComponent,
        data: {title: 'Edit Vendor', guiSection: 'Edit Vendor'},
      },
      {
        path: 'vendor_rates',
        component: VendorRatesComponent,
        data: {title: 'Vendor Rates', guiSection: 'Vendor Rates'},
      },
      {
        path: 'vendor_rate_comparison',
        component: VendorRateComparisonComponent,
        data: {title: 'Vendor Rate Comparison', guiSection: 'Vendor Rate Comparison'},
      },
      {
        path: 'buy_number',
        component: BuyNumberComponent,
        data: {title: 'Buy Number', guiSection: 'Buy Number'},
      },
      {
        path: 'customer_number',
        component: CustomerNumberComponent,
        data: {title: 'Customer Number', guiSection: 'Customer Number'},
      },
      {
        path: 'tfn_number_management',
        component: TfnNumberManagementComponent,
        data: {title: 'TFN Number Management', guiSection: 'TFN Number Management'},
      },
      {
        path: 'did_number_management',
        component: DidNumberManagementComponent,
        data: {title: 'DID Number Management', guiSection: 'DID Number Management'},
      },
      {
        path: 'cdrs_import',
        component: CdrsComponent,
        data: {title: 'CDRs Import', guiSection: 'CDRs Import'},
      },
      {
        path: 'cdr_import_history',
        component: CdrImportHistoryComponent,
        data: {title: 'CDR Import History', guiSection: 'CDR Import History'},
      },
      {
        path: 'cdr_log',
        component: CdrLogComponent,
        data: {title: 'CDR Log', guiSection: 'CDR Log'},
      },
      {
        path: 'lrn',
        component: LrnComponent,
        data: {title: 'LRN Management', guiSection: 'LRN Management'},
      },
      {
        path: 'auto_generate_statement',
        component: AutoGenerateStatementComponent,
        data: {title: 'Auto Generate Statement', guiSection: 'Auto Generate Statement'},
      },
      {
        path: 'create_billing_statement',
        component: CreateBillingStatementComponent,
        data: {title: 'Create Billing Statement', guiSection: 'Create Billing Statement'},
      },
      {
        path: 'view_billing_statement',
        component: ViewBillingStatementComponent,
        data: {title: 'View Billing Statement', guiSection: 'View Billing Statement'},
      },
      {
        path: 'tax_management',
        component: TaxManagementComponent,
        data: {title: 'Tax Management', guiSection: 'Tax Management'},
      },
      {
        path: 'rerate_calls',
        component: RerateCallsComponent,
        data: {title: 'Rerate Calls', guiSection: 'Rerate Calls'},
      },
      {
        path: 'auto_generate_invoice',
        component: AutoGenerateInvoiceComponent,
        data: {title: 'Auto Generate Invoice', guiSection: 'Auto Generate Invoice'},
      },
      {
        path: 'customer_payment',
        component: CustomerPaymentComponent,
        data: {title: 'Customer Payment', guiSection: 'Customer Payment'},
      },
      {
        path: 'statement_account',
        component: StatementAccountComponent,
        data: {title: 'Statement Account', guiSection: 'Statement Account'},
      },
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {
  static components = [
  ];
}
