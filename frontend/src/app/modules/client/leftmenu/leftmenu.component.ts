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
          items: [
            { hidden: false, label: 'Dashboard', icon: 'pi pi-fw pi-home', link: ROUTES.dashboard },
          ]
        },
        {
          label: 'Settings',
          hidden: false,
          items: [
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_ROLE), label: 'Roles', icon: 'pi pi-fw pi-check-circle', link: ROUTES.configuration.roles },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_USER), label: 'Users', icon: 'pi pi-fw pi-user', link: ROUTES.configuration.users },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_COMPANY), label: 'Company', icon: 'pi pi-fw pi-building', link: ROUTES.configuration.company },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_SOMOS_USER), label: 'Somos Users', icon: 'pi pi-fw pi-users', link: ROUTES.configuration.somos_users },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_ID_RO), label: 'ID & RO', icon: 'pi pi-fw pi-credit-card', link: ROUTES.configuration.id_ro },
            { hidden: !state.user?.permissions?.includes(PERMISSIONS.READ_SQL_SCRIPT), label: 'SQL Scripts', icon: 'pi pi-fw pi-database', items: [
                { hidden: false, label: 'SQL Scripts', icon: 'pi pi-fw pi-align-center', link: ROUTES.configuration.sql_scripts },
              ]
            },
          ]
        },
      ];
    });
  }

}
