import {useEffect,useState,type ReactNode} from 'react';
import {useAuthStore} from '@/stores/useAuthStore';
import {reviewsRepo,isSupabaseConfigured} from '@/repositories';
import {OwnReviewsContext,type OwnReviewState} from './ownReviewsContext';
export function OwnReviewsProvider({children}:{children:ReactNode}){
 const owner=useAuthStore(s=>s.session?.user.id??null);const[state,setState]=useState<OwnReviewState>({owner:null,rows:null,error:false});
 useEffect(()=>{let alive=true;if(!owner||!isSupabaseConfigured)return;reviewsRepo.mine().then(rows=>{if(alive)setState({owner,rows,error:false});}).catch(()=>{if(alive)setState({owner,rows:null,error:true});});return()=>{alive=false;};},[owner]);
 return <OwnReviewsContext value={state.owner===owner?state:{owner,rows:null,error:false}}>{children}</OwnReviewsContext>;
}
