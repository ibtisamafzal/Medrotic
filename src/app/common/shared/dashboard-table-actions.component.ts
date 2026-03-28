import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Shared table row actions with consistent icons across admin and portal dashboards.
 */
@Component({
  selector: 'app-dashboard-table-actions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-table-actions.component.html',
  styleUrl: './dashboard-table-actions.component.scss',
})
export class DashboardTableActionsComponent {
  @Input() busy = false;

  /** When set, renders primary "view" as router link (eye icon). */
  @Input() viewLink: any[] | null = null;
  @Input() viewTitle = 'View profile';

  /** Eye icon button (e.g. open profile modal) — use when there is no `viewLink`. */
  @Input() showViewButton = false;

  /** Optional second link, e.g. patient analytics (chart icon). */
  @Input() analyticsLink: any[] | null = null;

  @Input() showEdit = false;
  @Input() editTitle = 'Edit';

  /** When `'action'`, show verify button. When `'verified'` / `'rejected'`, show read-only pill (no re-verify prompt). */
  @Input() verificationUi: 'action' | 'verified' | 'rejected' | null = null;

  @Input() showVerify = false;
  @Input() verifyTitle = 'Verify';

  @Input() showDelete = false;
  @Input() deleteTitle = 'Delete';

  /** Primary solid button — e.g. book appointment (calendar icon). */
  @Input() showBook = false;
  @Input() bookTitle = 'Book appointment';

  @Output() viewClick = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() verify = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() book = new EventEmitter<void>();
}
