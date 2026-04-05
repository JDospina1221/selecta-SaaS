import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import Chart from 'chart.js/auto';

@Component({ selector: 'app-dashboard', standalone: true, imports: [CommonModule], templateUrl: './dashboard.html' })
export class DashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  adminKpis = this.adminService.kpis;
  dashStartDate = signal(''); dashEndDate = signal('');
  chartInstance: any = null;

 constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      
      // ✅ ELIMINAMOS EL PARCHE: Solo cargamos si hay un usuario y un tenantId real
      if (user?.tenantId && !this.adminKpis()) {
        this.adminService.loadKPIs(user.tenantId);
      }

      const kpis = this.adminKpis();
      if (kpis && kpis.dailyTrends) { 
        setTimeout(() => this.renderChart(kpis.dailyTrends || []), 0); 
      }
    });
  }

  ngOnInit() {}

  updateDashStart(e: any) { this.dashStartDate.set(e.target.value); } updateDashEnd(e: any) { this.dashEndDate.set(e.target.value); }
  applyDashboardFilter() { 
    const tenantId = this.authService.currentUser()?.tenantId;
      if (tenantId) {
        this.adminService.loadKPIs(tenantId, this.dashStartDate(), this.dashEndDate()); 
    }
  }
  clearDashboardFilter() { 
    this.dashStartDate.set(''); 
    this.dashEndDate.set(''); 
    const tenantId = this.authService.currentUser()?.tenantId;
    if (tenantId) {
      this.adminService.loadKPIs(tenantId); 
    }
  }
  renderChart(trends: any[]) {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartInstance) this.chartInstance.destroy();
    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: { labels: trends.map(t => t.date), datasets: [ { label: 'Ingresos Brutos ($)', data: trends.map(t => t.revenue), borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.4 }, { label: 'Ganancia Neta ($)', data: trends.map(t => t.profit), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 } ] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}