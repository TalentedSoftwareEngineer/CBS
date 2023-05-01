import {Component, ElementRef, OnInit} from '@angular/core';
import {NavigationStart, Router} from "@angular/router";
import {StoreService} from "../../../services/store/store.service";
import {ApiService} from "../../../services/api/api.service";
import {LayoutService} from "../../../services/layout/layout.service";
import { ROUTES } from "../../../app.routes";
import { PERMISSIONS } from 'src/app/consts/permissions';

@Component({
  selector: 'app-leftmenu',
  templateUrl: './leftmenu.component.html',
  styleUrls: ['./leftmenu.component.scss']
})
export class LeftmenuComponent implements OnInit {

  url: string;
  user: any = {};

  menu: any[] = [];

  isMenuLoaded = false

  constructor(
    private router: Router,
    private store: StoreService,
    private api: ApiService,
    public layoutService: LayoutService, public el: ElementRef
  ) {
    this.url = this.router.url;
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Navigation started.
        this.url = event.url;
      }
    });
  }

  ngOnInit(): void {
    this.store.state$.subscribe(async (state)=>{
      this.menu = [
        {
          label: 'Dashboard',
          hidden: false,
          icon: 'pi pi-fw pi-home',
          items: [
            { hidden: false, label: 'System Overview', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.dashboard.system_overview },
            { hidden: false, label: 'Billing Overview', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.dashboard.billing_overview },
            { hidden: false, label: 'Client Activities', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.dashboard.client_activities },
            { hidden: false, label: 'Short Cuts', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.dashboard.short_cuts },
          ]
        },
        {
          label: 'Administration',
          hidden: false,
          icon: 'pi pi-fw pi-users',
          items: [
            { hidden: false, label: 'Account Management', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.administration.account },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_LOGO_MANAGEMENT), label: 'Logo Management', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.administration.logo },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_BANNER_MANAGEMENT), label: 'Banner Management', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.administration.banner },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_LERG_MANAGEMENT), label: 'Lerg Management', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.administration.lerg },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_LRN_MANAGEMENT), label: 'LRN Management', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.administration.lrn },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_CDRS_IMPORT), label: 'CDR Server Management ', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.reports.cdrs_import },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.CDR_IMPORT_HISTORY), label: 'CDR Import History', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.reports.cdr_import_history },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.CDR_LOG), label: 'CDR Log', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.reports.cdr_log },
          ]
        },
        {
          label: 'Client Management',
          hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_CUSTOMERS) && !state.user?.permissions?.includes(PERMISSIONS.READ_ROLES) && !state.user?.permissions?.includes(PERMISSIONS.READ_USERS),
          icon: 'pi pi-fw pi-users',
          items: [
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_CUSTOMERS), label: 'Manage Customer', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.client_mng.customer },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_ROLES), label: 'Manage Roles', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.client_mng.roles },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_USERS), label: 'Manage User', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.client_mng.user }
          ]
        },
        {
          label: 'Vendor Management',
          hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_VENDORS) && !state.user?.permissions?.includes(PERMISSIONS.READ_VENDOR_RATES) && !state.user?.permissions?.includes(PERMISSIONS.VENDOR_COMPARATION),
          icon: 'pi pi-fw pi-users',
          items: [
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_VENDORS), label: 'Manage Vendor', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.vendor_mng.vendor },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_VENDOR_RATES), label: 'Vendor Rates', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.vendor_mng.vendor_rates },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.VENDOR_COMPARATION), label: 'Vendor Rate Comparison', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.vendor_mng.vendor_rate_comparison }
          ]
        },
        {
          label: 'Number Management',
          hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_BUY_NUMBERS) && !state.user?.permissions?.includes(PERMISSIONS.READ_CUSTOMER_NUMBERS) && !state.user?.permissions?.includes(PERMISSIONS.READ_TFN_NUMBERS) && !state.user?.permissions?.includes(PERMISSIONS.READ_DID_NUMBERS),
          icon: 'pi pi-fw pi-users',
          items: [
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_BUY_NUMBERS), label: 'Buy Number ', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.number_mng.buy_number },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_CUSTOMER_NUMBERS), label: 'Customer Number', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.number_mng.customer_number },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_TFN_NUMBERS), label: 'TFN Number Management', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.number_mng.tfn_number },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_DID_NUMBERS), label: 'DID Number Management', icon: 'pi pi-fw pi-angle-double-right', link: ROUTES.number_mng.did_number },
          ]
        }
      ];
    });
  }

}
