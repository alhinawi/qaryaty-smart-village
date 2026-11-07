// ─── الأكتر طلبًا في القرية هذا الأسبوع: shops ranked by real order counts
// over the last 7 days. In real mode only real counts show (and the section
// hides when there are too few); in demo mode a labeled sample ranking shows.
export interface WeeklyTopShop {
  shopId: number;
  orderCount: number;
  /** True for the labeled demo-mode sample ranking — never real data. */
  isSample?: boolean;
}

export interface TopShopsRepo {
  listWeekly(limit: number): Promise<WeeklyTopShop[]>;
}
