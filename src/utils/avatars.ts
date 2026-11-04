// ─── Profile pictures for sample people, from the free DiceBear API (https://www.dicebear.com)
// Illustrated avatars, not photos of real strangers: no fake "real" faces on sample teachers.
// Each person has a fixed seed, so the picture is the same on every load and every device.
// The options are limited to what fits a village app: women wear a hijab with a closed neckline, men have short hair and
// sometimes a beard or moustache, skin tones from the Egyptian range, smiling or calm faces only.
// If the picture fails to load, <Avatar> shows the person's initials instead.
import type { Gender } from '@/types';

const DICEBEAR = 'https://api.dicebear.com/9.x/avataaars/svg';

const SHARED: Record<string, string> = {
  skinColor: 'edb98a,d08b5b,ae5d29',
  mouth: 'smile,default',
  eyes: 'default,happy',
  eyebrows: 'default,defaultNatural',
  clothesColor: '262e33,3c4f5c,25557c,5199e4,929598,e6e6e6',
  backgroundColor: 'e8f5ee',
};

const BY_GENDER: Record<Gender, Record<string, string>> = {
  female: {
    top: 'hijab',
    // Closed necklines only: no V-neck under the hijab
    clothing: 'blazerAndSweater,collarAndSweater,shirtCrewNeck',
    hatColor: '3c4f5c,25557c,5e3a2e,7a2e3b,1f6f5c,929598,b1a296',
    facialHairProbability: '0',
    accessories: 'prescription01,prescription02,round',
    accessoriesProbability: '15',
  },
  male: {
    clothing: 'blazerAndShirt,blazerAndSweater,collarAndSweater,shirtCrewNeck,shirtVNeck',
    top: 'shortFlat,shortRound,shortWaved,shortCurly,sides,theCaesar,theCaesarAndSidePart',
    hairColor: '2c1b18,4a312c,724133',
    facialHair: 'beardLight,beardMedium,moustacheFancy',
    facialHairColor: '2c1b18,4a312c',
    facialHairProbability: '50',
    accessories: 'prescription01,prescription02,round',
    accessoriesProbability: '20',
  },
};

/** Fixed picture URL for a sample person (same seed, same picture). */
export function avatarUrl(seed: string, gender: Gender): string {
  const params = new URLSearchParams({ seed, ...SHARED, ...BY_GENDER[gender] });
  return `${DICEBEAR}?${params.toString()}`;
}

/** Picture for provider number `id` in the sample data. */
export function providerPhoto(id: number, gender: Gender): string {
  return avatarUrl(`qaryaty-provider-${id}`, gender);
}
