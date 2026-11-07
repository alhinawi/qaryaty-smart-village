export interface PublicReview {
  id: string;
  authorLabel: string;
  stars: number;
  text: string;
  createdAt: string;
  completedOrder: boolean;
}
export function reviewSummary(rows: PublicReview[]) {
  const valid = rows.filter(row => row.completedOrder && Number.isInteger(row.stars) && row.stars >= 1 && row.stars <= 5);
  return { count: valid.length, average: valid.length ? valid.reduce((sum, row) => sum + row.stars, 0) / valid.length : null, distribution: [5,4,3,2,1].map(stars => ({ stars, count: valid.filter(row => row.stars === stars).length })) };
}
export function sortedReviews(rows: PublicReview[], sort: 'newest' | 'highest' | 'lowest') {
  return rows.filter(row => row.completedOrder && Number.isInteger(row.stars) && row.stars >= 1 && row.stars <= 5).slice().sort((a,b) => sort === 'newest' ? Date.parse(b.createdAt)-Date.parse(a.createdAt) : (sort === 'highest' ? b.stars-a.stars : a.stars-b.stars) || Date.parse(b.createdAt)-Date.parse(a.createdAt));
}
