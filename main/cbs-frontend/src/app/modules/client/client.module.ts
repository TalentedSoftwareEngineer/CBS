import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';

import { LeftmenuComponent } from './leftmenu/leftmenu.component';
import { SharedModule} from './shared/shared.module';

import {MenuModule} from "primeng/menu";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {SplitButtonModule} from "primeng/splitbutton";
import {ToggleButtonModule} from "primeng/togglebutton";
import {PanelMenuModule} from "primeng/panelmenu";
import {TableModule} from "primeng/table";
import {ChartModule} from "primeng/chart";
import {PaginatorModule} from "primeng/paginator";
import {SelectButtonModule} from "primeng/selectbutton";
import {AutoCompleteModule} from "primeng/autocomplete";
import {InputTextModule} from "primeng/inputtext";
import {InputSwitchModule} from 'primeng/inputswitch';
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {ProgressBarModule} from 'primeng/progressbar';
import {DialogModule} from 'primeng/dialog';
import {PanelModule} from 'primeng/panel';
import {StyleClassModule} from 'primeng/styleclass';
import {AccordionModule} from 'primeng/accordion';
import {DropdownModule} from 'primeng/dropdown';
import {PasswordModule} from 'primeng/password';
import {DividerModule} from 'primeng/divider';
import {CheckboxModule} from 'primeng/checkbox';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {RadioButtonModule} from 'primeng/radiobutton';
import {TabViewModule} from 'primeng/tabview';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {MessagesModule} from 'primeng/messages';
import {MessageModule} from 'primeng/message';
import {FileUploadModule} from 'primeng/fileupload';
import {BadgeModule} from 'primeng/badge';
import {TooltipModule} from 'primeng/tooltip';
import {CalendarModule} from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputMaskModule} from 'primeng/inputmask';
import {PickListModule} from 'primeng/picklist';

// @ts-ignore
import {CountToModule} from "angular-count-to";
import {FooterComponent} from "./footer/footer.component";
import {LayoutComponent} from "./layout/layout.component";
import {AppMenuitemComponent} from "./leftmenu/menuitem.component";
import { ManageCustomerComponent } from './manage-customer/manage-customer.component';
import { ManageRolesComponent } from './manage-roles/manage-roles.component';
import { ManageUserComponent } from './manage-user/manage-user.component';
import { ManageVendorComponent } from './manage-vendor/manage-vendor.component';
import { VendorRatesComponent } from './vendor-rates/vendor-rates.component';
import { VendorRateComparisonComponent } from './vendor-rate-comparison/vendor-rate-comparison.component';
import { BuyNumberComponent } from './buy-number/buy-number.component';
import { CustomerNumberComponent } from './customer-number/customer-number.component';
import { TfnNumberManagementComponent } from './tfn-number-management/tfn-number-management.component';
import { DidNumberManagementComponent } from './did-number-management/did-number-management.component';
import { BillingOverviewComponent } from './billing-overview/billing-overview.component';
import { ClientActivitiesComponent } from './client-activities/client-activities.component';
import { ShortCutsComponent } from './short-cuts/short-cuts.component';
import { AccountComponent } from './account/account.component';
import { LogoComponent } from './logo/logo.component';
import { BannerComponent } from './banner/banner.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CustomerEditComponent } from './customer-edit/customer-edit.component';
import { LergComponent } from './lerg/lerg.component';
import { VendorEditComponent } from './vendor-edit/vendor-edit.component';
import { CdrsComponent } from './cdrs/cdrs.component';
import { CdrImportHistoryComponent } from './cdr-import-history/cdr-import-history.component';
import { CdrLogComponent } from './cdr-log/cdr-log.component';
import { PhoneFormatPipe } from 'src/app/pipes/phone-format.pipe';
import { DurationRangeComponent } from 'src/app/components/duration-range/duration-range.component';
import { CallCountRangeComponent } from 'src/app/components/call-count-range/call-count-range.component';
import { LrnComponent } from './lrn/lrn.component';
import { AutoGenerateStatementComponent } from './auto-generate-statement/auto-generate-statement.component';
import { CreateBillingStatementComponent } from './create-billing-statement/create-billing-statement.component';
import { ViewBillingStatementComponent } from './view-billing-statement/view-billing-statement.component';
import { TaxManagementComponent } from './tax-management/tax-management.component';
import { RerateCallsComponent } from './rerate-calls/rerate-calls.component';
import { AutoGenerateInvoiceComponent } from './auto-generate-invoice/auto-generate-invoice.component';
import { CustomerPaymentComponent } from './customer-payment/customer-payment.component';
import { StatementAccountComponent } from './statement-account/statement-account.component';
import { CustomerAccountComponent } from './customer-account/customer-account.component';
import {BlockUIModule} from "primeng/blockui";

@NgModule({
  imports: [
    CommonModule,
    ClientRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,

    // primeng component modules
    MenuModule,
    BlockUIModule,
    ButtonModule,
    InputTextModule,
    InputSwitchModule,
    RippleModule,
    PanelMenuModule,
    SplitButtonModule,
    ToggleButtonModule,
    TableModule,
    PaginatorModule,
    DropdownModule,
    ChartModule,
    SelectButtonModule,
    AutoCompleteModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    ProgressBarModule,
    DialogModule,
    PanelModule,
    StyleClassModule,
    AccordionModule,
    PasswordModule,
    DividerModule,
    CheckboxModule,
    InputTextareaModule,
    RadioButtonModule,
    TabViewModule,
    OverlayPanelModule,
    MessagesModule,
    MessageModule,
    FileUploadModule,
    BadgeModule,
    TooltipModule,
    CalendarModule,
    TagModule,
    InputNumberModule,
    InputMaskModule,
    PickListModule,
    // ---------------------------------

    CountToModule,
  ],
  declarations: [
    HeaderComponent,
    LeftmenuComponent,
    AppMenuitemComponent,
    FooterComponent,
    LayoutComponent,
    DashboardComponent,
    ManageCustomerComponent,
    ManageRolesComponent,
    ManageUserComponent,
    ManageVendorComponent,
    VendorRatesComponent,
    VendorRateComparisonComponent,
    BuyNumberComponent,
    CustomerNumberComponent,
    TfnNumberManagementComponent,
    DidNumberManagementComponent,
    BillingOverviewComponent,
    ClientActivitiesComponent,
    ShortCutsComponent,
    AccountComponent,
    CustomerAccountComponent,
    LogoComponent,
    BannerComponent,
    CustomerEditComponent,
    LergComponent,
    VendorEditComponent,
    CdrsComponent,
    CdrImportHistoryComponent,
    CdrLogComponent,
    PhoneFormatPipe,
    DurationRangeComponent,
    CallCountRangeComponent,
    LrnComponent,
    AutoGenerateStatementComponent,
    CreateBillingStatementComponent,
    ViewBillingStatementComponent,
    TaxManagementComponent,
    RerateCallsComponent,
    AutoGenerateInvoiceComponent,
    CustomerPaymentComponent,
    StatementAccountComponent,
    CustomerAccountComponent
  ],
  providers: [],
  exports: [
    LeftmenuComponent,
    HeaderComponent,
    FooterComponent
  ]
})
export class ClientModule { }
