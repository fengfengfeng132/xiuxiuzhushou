const PET_ART_BY_ID: Record<string, string> = {
  pet_teddy: "/pets/poodle_3d.png",
  pet_bichon: "/pets/dog_face_3d.png",
  pet_husky: "/pets/wolf_3d.png",
  pet_corgi: "/pets/dog_3d.png",
  pet_westie: "/pets/dog_face_3d.png",
  pet_samoyed: "/pets/dog_face_3d.png",
  pet_orange_cat: "/pets/cat_3d.png",
  pet_ragdoll: "/pets/cat_face_3d.png",
  pet_white_cat: "/pets/cat_face_3d.png",
  pet_black_cat: "/pets/black_cat_3d.png",
  pet_rabbit: "/pets/rabbit_3d.png",
  pet_chick: "/pets/baby_chick_3d.png",
  pet_duck: "/pets/duck_3d.png",
  pet_parrot: "/pets/parrot_3d.png",
  pet_sunbird: "/pets/bird_3d.png",
  pet_seagull: "/pets/bird_3d.png",
  pet_hamster: "/pets/hamster_3d.png",
  pet_capybara: "/pets/beaver_3d.png",
  pet_panda: "/pets/panda_3d.png",
  pet_lizard: "/pets/lizard_3d.png",
  pet_koala: "/pets/koala_3d.png",
  pet_piglet: "/pets/pig_3d.png",
  pet_sloth: "/pets/sloth_3d.png",
  pet_fox: "/pets/fox_3d.png",
};

export function getPetArtSrc(definitionId: string): string | null {
  return PET_ART_BY_ID[definitionId] ?? null;
}
