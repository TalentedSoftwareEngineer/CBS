import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  data: any;
    
  options: any;
  constructor(
    public api: ApiService,
  ) { }

  ngOnInit(): void {
    this.data = {
        labels: ['00 AM', '01 AM', '02 AM', '03 AM', '04 AM', '05 AM', '06 AM'],
        datasets: [
            {
                label: 'New Oders',
                data: [0, 0.3, 0.8, 0.8, 0.6, 0.5, 0.4],
                fill: false,
                tension: .4,
                borderColor: '#42A5F5',
                yAxisID: 'y',
            },
            {
                label: 'Activated Orders',
                data: [0.8, 0.8, 0.4, 0.9, 0.6, 0.7, 1],
                fill: false,
                borderDash: [5, 5],
                tension: .4,
                borderColor: '#66BB6A',
                yAxisID: 'y',
            },
            {
                label: 'Income',
                data: [0.5, 0.6, 0.2, 0.3, 0.1, 0.6, 0.4],
                fill: true,
                borderColor: '#FFA726',
                tension: .4,
                backgroundColor: 'rgba(255,167,38,0.2)',
                yAxisID: 'y',
            }
        ]
    }
  
    this.options = {
        plugins: {
            title: {
                display: true,
                text: 'System Overview',
                fontSize: 16
            },
            legend: {
                position: 'top',
            }
        },
    };
  }

    selectData(event: any) {
        //event.dataset = Selected dataset
        //event.element = Selected element
        //event.element._datasetIndex = Index of the dataset in data
        //event.element._index = Index of the data in dataset
    }

}
