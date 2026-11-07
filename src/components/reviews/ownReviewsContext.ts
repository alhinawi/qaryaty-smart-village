import { createContext,useContext } from 'react';
export interface OwnReviewState {owner:string|null;rows:{order_id:string;status:string}[]|null;error:boolean}
export const OwnReviewsContext=createContext<OwnReviewState>({owner:null,rows:null,error:false});
export const useOwnReviews=()=>useContext(OwnReviewsContext);
