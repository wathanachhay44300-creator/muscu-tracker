import type { Equipment, LoadType, MuscleGroup, MuscleId } from '../types'

/** One predefined exercise. `seedId` is a stable slug of the French name and never changes. */
export interface LibraryExercise {
  seedId: string
  name: string
  group: MuscleGroup
  equipment: Equipment
  /** Key into FAMILIES (shared instructions). */
  family: string
  primary: MuscleId[]
  secondary: MuscleId[]
  /** Extra search words (English names, abbreviations, other French wordings). */
  synonyms: string[]
  /** Done one side at a time (kept for a future unilateral mode; not used by the app yet). */
  unilateral: boolean
  loadType: LoadType
}

export const EQUIPMENT_LOAD_TYPE: Record<Equipment, LoadType> = {
  barre: 'Barre libre',
  ez: 'Barre libre',
  halteres: 'Haltères',
  machine: 'Machine à plaques',
  smith: 'Machine à plaques',
  poulie: 'Poulie / pile de poids',
  poids_du_corps: 'Poids du corps',
}

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type M = MuscleId
const E = {
  PEC: 'pectoraux',
  DA: 'delt_ant',
  DL: 'delt_lat',
  DP: 'delt_post',
  TRAP: 'trapezes',
  LAT: 'grand_dorsal',
  MID: 'milieu_dos',
  LOMB: 'lombaires',
  BI: 'biceps',
  TRI: 'triceps',
  AVB: 'avant_bras',
  ABS: 'abdominaux',
  OBL: 'obliques',
  QUAD: 'quadriceps',
  ADD: 'adducteurs',
  ISC: 'ischios',
  FES: 'fessiers',
  MFE: 'moyen_fessier',
  MOL: 'mollets',
} as const satisfies Record<string, M>
const { PEC, DA, DL, DP, TRAP, LAT, MID, LOMB, BI, TRI, AVB, ABS, OBL, QUAD, ADD, ISC, FES, MFE, MOL } = E

const entries: LibraryExercise[] = []

function ex(
  name: string,
  group: MuscleGroup,
  equipment: Equipment,
  family: string,
  primary: M[],
  secondary: M[],
  synonyms = '',
  unilateral = false,
): void {
  entries.push({
    seedId: slugify(name),
    name,
    group,
    equipment,
    family,
    primary,
    secondary,
    synonyms: synonyms ? synonyms.split(',').map((s) => s.trim()) : [],
    unilateral,
    loadType: EQUIPMENT_LOAD_TYPE[equipment],
  })
}

/* --------------------------------- Pectoraux --------------------------------- */
ex('Développé couché', 'Pectoraux', 'barre', 'press_flat', [PEC], [DA, TRI], 'bench press, dc, développé couché barre, barbell bench press')
ex('Développé couché haltères', 'Pectoraux', 'halteres', 'press_flat', [PEC], [DA, TRI], 'dumbbell bench press, db press, dc haltères')
ex('Développé couché Smith', 'Pectoraux', 'smith', 'press_flat', [PEC], [DA, TRI], 'smith bench press, développé couché smith machine')
ex('Développé couché machine (chest press)', 'Pectoraux', 'machine', 'press_flat', [PEC], [DA, TRI], 'chest press, machine chest press, développé couché guidé, presse pectoraux')
ex('Développé incliné', 'Pectoraux', 'barre', 'press_incline', [PEC, DA], [TRI], 'incline bench press, développé incliné barre')
ex('Développé incliné haltères', 'Pectoraux', 'halteres', 'press_incline', [PEC, DA], [TRI], 'incline dumbbell press, incline db press')
ex('Développé incliné Smith', 'Pectoraux', 'smith', 'press_incline', [PEC, DA], [TRI], 'incline smith press, développé incliné smith machine')
ex('Développé incliné machine', 'Pectoraux', 'machine', 'press_incline', [PEC, DA], [TRI], 'incline chest press, machine incline press')
ex('Développé décliné', 'Pectoraux', 'barre', 'press_decline', [PEC], [TRI, DA], 'decline bench press, développé décliné barre')
ex('Développé décliné Smith', 'Pectoraux', 'smith', 'press_decline', [PEC], [TRI, DA], 'decline smith press')
ex('Développé décliné machine', 'Pectoraux', 'machine', 'press_decline', [PEC], [TRI, DA], 'decline chest press, machine decline')
ex('Pec deck (butterfly)', 'Pectoraux', 'machine', 'pec_deck', [PEC], [DA], 'pec deck, butterfly, machine papillon, fly machine, pec fly')
ex('Écarté couché haltères', 'Pectoraux', 'halteres', 'fly_flat', [PEC], [DA], 'dumbbell fly, écartés à plat, écartés haltères, chest fly')
ex('Écarté incliné haltères', 'Pectoraux', 'halteres', 'fly_incline', [PEC, DA], [], 'incline dumbbell fly, écartés inclinés, incline fly')
ex('Croisés poulie haute (vis-à-vis)', 'Pectoraux', 'poulie', 'cable_fly_high', [PEC], [DA], 'cable crossover, cable fly, vis-à-vis, écartés poulie haute, croisés poulie')
ex('Écartés poulie basse', 'Pectoraux', 'poulie', 'cable_fly_low', [PEC, DA], [], 'low cable fly, croisés poulie basse, low to high cable fly')
ex('Pompes', 'Pectoraux', 'poids_du_corps', 'pushup', [PEC], [DA, TRI, ABS], 'push up, push-ups, pushups')
ex('Dips', 'Pectoraux', 'poids_du_corps', 'chest_dips', [PEC], [TRI, DA], 'dips pectoraux, parallel bar dips, chest dips')
ex('Pull-over haltère', 'Pectoraux', 'halteres', 'pullover_db', [PEC, LAT], [TRI], 'pullover, pull over haltère, dumbbell pullover')

/* ----------------------------------- Dos ----------------------------------- */
ex('Tractions', 'Dos', 'poids_du_corps', 'pullup', [LAT], [BI, MID, AVB], 'pull up, pull-up, traction pronation, tractions pronation')
ex('Tractions supination', 'Dos', 'poids_du_corps', 'pullup', [LAT, BI], [MID, AVB], 'chin up, chin-up, tractions prise supination')
ex('Tractions prise neutre', 'Dos', 'poids_du_corps', 'pullup', [LAT], [BI, MID, AVB], 'neutral grip pull up, tractions marteau')
ex('Tractions assistées machine', 'Dos', 'machine', 'pullup_assisted', [LAT], [BI, MID], 'assisted pull up, traction guidée, machine tractions assistées, assisted chin')
ex('Tirage vertical', 'Dos', 'poulie', 'lat_pulldown', [LAT], [BI, MID, DP], 'lat pulldown, tirage poulie haute, tirage vertical prise large, tirage poitrine')
ex('Tirage vertical prise serrée', 'Dos', 'poulie', 'lat_pulldown', [LAT], [BI, MID], 'close grip lat pulldown, tirage poulie haute prise serrée')
ex('Tirage vertical prise neutre', 'Dos', 'poulie', 'lat_pulldown', [LAT], [BI, MID], 'neutral grip pulldown, tirage poulie haute neutre')
ex('Tirage vertical supination', 'Dos', 'poulie', 'lat_pulldown', [LAT, BI], [MID], 'reverse grip pulldown, underhand pulldown, tirage poulie haute supination')
ex('Tirage horizontal', 'Dos', 'poulie', 'seated_row', [LAT, MID], [BI, DP, TRAP], 'seated cable row, tirage poulie basse, rowing poulie, low row')
ex('Rowing barre', 'Dos', 'barre', 'barbell_row', [LAT, MID], [BI, LOMB, DP], 'barbell row, bent over row, rowing buste penché')
ex('Rowing haltère', 'Dos', 'halteres', 'one_arm_row', [LAT, MID], [BI, DP], 'one arm dumbbell row, rowing un bras, rowing haltère un bras, db row', true)
ex('Rowing Smith', 'Dos', 'smith', 'barbell_row', [LAT, MID], [BI, LOMB, DP], 'smith row, smith machine row')
ex('Rowing machine assis', 'Dos', 'machine', 'machine_row', [LAT, MID], [BI, DP], 'seated row machine, rowing machine, machine rowing assis')
ex('Rowing machine appui poitrine', 'Dos', 'machine', 'machine_row', [MID, LAT], [BI, DP, TRAP], 'chest supported row, rowing appui-poitrine, rowing machine poitrine')
ex('Rowing machine convergent', 'Dos', 'machine', 'machine_row', [LAT, MID], [BI, DP], 'converging row, hammer strength row, rowing convergent, machine convergente')
ex('Rowing T-bar', 'Dos', 'barre', 'tbar_row', [LAT, MID], [BI, LOMB, TRAP], 't-bar row, t bar row, rowing t bar')
ex('Pull-over poulie', 'Dos', 'poulie', 'straight_arm', [LAT], [TRI, PEC], 'straight arm pulldown, pullover poulie, pull-over poulie haute, tirage bras tendus')
ex('Extension lombaires (banc à 45°)', 'Dos', 'poids_du_corps', 'back_ext', [LOMB], [FES, ISC], 'back extension, hyperextension, banc à lombaires, lombaires, hyper extension')
ex('Soulevé de terre', 'Dos', 'barre', 'deadlift', [LOMB, FES, ISC], [TRAP, QUAD, AVB, LAT], 'deadlift, sdt, soulevé de terre barre')
ex('Soulevé de terre sumo', 'Dos', 'barre', 'deadlift', [FES, ISC, ADD], [LOMB, QUAD, TRAP, AVB], 'sumo deadlift, sdt sumo')
ex('Shrugs barre', 'Dos', 'barre', 'shrug', [TRAP], [AVB], 'barbell shrug, haussements d’épaules, shrug')
ex('Shrugs haltères', 'Dos', 'halteres', 'shrug', [TRAP], [AVB], 'dumbbell shrug, haussements d’épaules haltères')
ex('Shrugs Smith', 'Dos', 'smith', 'shrug', [TRAP], [AVB], 'smith shrug, haussements d’épaules smith')
ex('Shrugs machine', 'Dos', 'machine', 'shrug', [TRAP], [AVB], 'machine shrug, haussements d’épaules machine')

/* --------------------------------- Épaules --------------------------------- */
ex('Développé militaire', 'Épaules', 'barre', 'ohp', [DA], [DL, TRI, TRAP], 'overhead press, military press, ohp, développé épaules barre, barbell shoulder press')
ex('Développé haltères épaules', 'Épaules', 'halteres', 'ohp', [DA, DL], [TRI, TRAP], 'dumbbell shoulder press, développé épaules haltères, db shoulder press')
ex('Développé militaire Smith', 'Épaules', 'smith', 'ohp', [DA], [DL, TRI, TRAP], 'smith shoulder press, développé épaules smith, smith military press')
ex('Développé épaules machine (shoulder press)', 'Épaules', 'machine', 'ohp', [DA, DL], [TRI, TRAP], 'shoulder press, machine shoulder press, développé épaules machine, presse épaules')
ex('Développé Arnold', 'Épaules', 'halteres', 'arnold', [DA, DL], [TRI, DP], 'arnold press, développé arnold')
ex('Élévations latérales', 'Épaules', 'halteres', 'lateral_raise', [DL], [TRAP, DA], 'lateral raise, side raise, élévations latérales haltères')
ex('Élévations latérales poulie', 'Épaules', 'poulie', 'lateral_raise', [DL], [TRAP], 'cable lateral raise, élévation latérale poulie basse', true)
ex('Élévations latérales machine', 'Épaules', 'machine', 'lateral_raise', [DL], [TRAP], 'lateral raise machine, machine élévations latérales')
ex('Élévations frontales', 'Épaules', 'halteres', 'front_raise', [DA], [PEC], 'front raise, élévations frontales haltères')
ex('Oiseau (élévations arrière)', 'Épaules', 'halteres', 'rear_delt', [DP], [TRAP, MID], 'rear delt fly, bent over lateral raise, oiseau haltères, élévations buste penché')
ex('Oiseau machine (reverse pec deck)', 'Épaules', 'machine', 'rear_delt', [DP], [TRAP, MID], 'reverse pec deck, reverse fly machine, oiseau inversé, butterfly inversé, rear delt machine')
ex('Face pull', 'Épaules', 'poulie', 'face_pull', [DP], [TRAP, MID, DL], 'face pull, tirage visage, tirage poulie visage')
ex('Rowing menton', 'Épaules', 'barre', 'upright_row', [DL, TRAP], [BI, DA], 'upright row, rowing menton barre, tirage menton')

/* ---------------------------------- Biceps ---------------------------------- */
ex('Curl barre', 'Biceps', 'barre', 'curl', [BI], [AVB, DA], 'barbell curl, curl barre droite, curl biceps barre')
ex('Curl barre EZ', 'Biceps', 'ez', 'curl', [BI], [AVB, DA], 'ez bar curl, curl barre z, curl barre ez, curl ez')
ex('Curl haltères', 'Biceps', 'halteres', 'curl', [BI], [AVB, DA], 'dumbbell curl, curl biceps haltères, curl alterné')
ex('Curl marteau', 'Biceps', 'halteres', 'hammer', [BI, AVB], [], 'hammer curl, curl prise neutre, curl marteau haltères')
ex('Curl marteau poulie (corde)', 'Biceps', 'poulie', 'hammer', [BI, AVB], [], 'cable hammer curl, rope hammer curl, curl corde')
ex('Curl incliné', 'Biceps', 'halteres', 'incline_curl', [BI], [AVB], 'incline dumbbell curl, curl banc incliné')
ex('Curl pupitre', 'Biceps', 'barre', 'preacher', [BI], [AVB], 'preacher curl, curl pupitre barre, curl pupitre barre ez, larry scott')
ex('Curl pupitre machine', 'Biceps', 'machine', 'preacher', [BI], [AVB], 'preacher curl machine, curl pupitre guidé')
ex('Curl poulie basse', 'Biceps', 'poulie', 'cable_curl', [BI], [AVB], 'cable curl, curl poulie, curl câble')
ex('Curl concentré', 'Biceps', 'halteres', 'concentration', [BI], [AVB], 'concentration curl, curl concentration', true)
ex('Curl machine', 'Biceps', 'machine', 'curl', [BI], [AVB], 'machine curl, curl biceps machine, biceps machine')

/* ---------------------------------- Triceps ---------------------------------- */
ex('Extension triceps poulie', 'Triceps', 'poulie', 'pushdown', [TRI], [], 'tricep pushdown, extension poulie haute, pushdown, triceps poulie')
ex('Extension poulie haute (corde)', 'Triceps', 'poulie', 'pushdown', [TRI], [], 'rope pushdown, triceps rope, extension corde')
ex('Extension poulie haute (barre)', 'Triceps', 'poulie', 'pushdown', [TRI], [], 'bar pushdown, straight bar pushdown, extension barre droite poulie')
ex('Extension un bras poulie', 'Triceps', 'poulie', 'pushdown', [TRI], [], 'one arm pushdown, extension triceps un bras, single arm cable extension', true)
ex('Barre au front', 'Triceps', 'ez', 'skullcrusher', [TRI], [], 'skull crusher, skullcrusher, lying triceps extension, barre au front ez, barre front')
ex('Extension nuque haltère', 'Triceps', 'halteres', 'overhead_ext', [TRI], [], 'overhead triceps extension, french press haltère, extension haltère derrière la tête')
ex('Développé couché prise serrée', 'Triceps', 'barre', 'close_grip', [TRI], [PEC, DA], 'close grip bench press, dc prise serrée, cgbp')
ex('Développé couché prise serrée Smith', 'Triceps', 'smith', 'close_grip', [TRI], [PEC, DA], 'smith close grip bench, dc prise serrée smith')
ex('Dips triceps', 'Triceps', 'poids_du_corps', 'bar_dips_triceps', [TRI], [PEC, DA], 'triceps dips, dips barres parallèles triceps')
ex('Dips sur banc', 'Triceps', 'poids_du_corps', 'bench_dips', [TRI], [DA, PEC], 'bench dips, dips banc, dips chaise')
ex('Dips machine', 'Triceps', 'machine', 'tri_machine', [TRI], [PEC, DA], 'dip machine, machine dips, dips assistés machine, seated dip')
ex('Kickback triceps', 'Triceps', 'halteres', 'kickback', [TRI], [], 'triceps kickback, kick back, extension triceps penché', true)
ex('Machine triceps', 'Triceps', 'machine', 'tri_machine', [TRI], [], 'triceps machine, triceps extension machine, machine extension triceps')

/* ----------------------------- Jambes : quadriceps ----------------------------- */
ex('Squat', 'Quadriceps', 'barre', 'squat', [QUAD, FES], [ISC, LOMB, ADD, ABS], 'back squat, squat barre, barbell squat')
ex('Squat Smith', 'Quadriceps', 'smith', 'squat', [QUAD, FES], [ISC, ADD], 'smith squat, squat smith machine')
ex('Front squat', 'Quadriceps', 'barre', 'front_squat', [QUAD], [FES, ABS, LOMB], 'squat avant, front squat barre')
ex('Goblet squat', 'Quadriceps', 'halteres', 'goblet', [QUAD, FES], [ABS], 'squat goblet, squat haltère')
ex('Presse à cuisses', 'Quadriceps', 'machine', 'leg_press', [QUAD, FES], [ISC, ADD], 'leg press, presse 45, presse à cuisses inclinée, presse 45 degrés')
ex('Presse à cuisses horizontale', 'Quadriceps', 'machine', 'leg_press', [QUAD, FES], [ISC, ADD], 'horizontal leg press, seated leg press, presse horizontale')
ex('Hack squat machine', 'Quadriceps', 'machine', 'hack_squat', [QUAD], [FES, ADD], 'hack squat, squat hack, machine hack')
ex('Leg extension', 'Quadriceps', 'machine', 'leg_ext', [QUAD], [], 'leg extension, extension de jambes, extension quadriceps, quadriceps machine')
ex('Fentes', 'Quadriceps', 'halteres', 'lunge', [QUAD, FES], [ISC, ADD], 'lunges, fentes haltères, lunge', true)
ex('Fentes barre', 'Quadriceps', 'barre', 'lunge', [QUAD, FES], [ISC, ADD], 'barbell lunge, fentes avec barre', true)
ex('Fentes Smith', 'Quadriceps', 'smith', 'lunge', [QUAD, FES], [ISC, ADD], 'smith lunge, fentes smith machine', true)
ex('Fentes marchées', 'Quadriceps', 'halteres', 'walking_lunge', [QUAD, FES], [ISC, ADD], 'walking lunge, fentes marchées haltères, fentes en marchant', true)
ex('Squat bulgare', 'Quadriceps', 'halteres', 'bulgarian', [QUAD, FES], [ISC, ADD], 'bulgarian split squat, squat bulgare haltères, split squat bulgare', true)
ex('Squat bulgare Smith', 'Quadriceps', 'smith', 'bulgarian', [QUAD, FES], [ISC, ADD], 'smith bulgarian split squat, squat bulgare smith machine', true)
ex('Step-up', 'Quadriceps', 'halteres', 'step_up', [QUAD, FES], [ISC, MOL], 'step up, montée sur banc, montées sur marche', true)
ex('Adducteurs machine', 'Quadriceps', 'machine', 'adductor', [ADD], [], 'adductor machine, hip adduction, machine adducteurs, adduction')

/* --------------------------- Jambes : ischio-jambiers --------------------------- */
ex('Leg curl', 'Ischio-jambiers', 'machine', 'leg_curl_lying', [ISC], [MOL], 'leg curl, curl jambes, curl ischios, ischios machine')
ex('Leg curl allongé', 'Ischio-jambiers', 'machine', 'leg_curl_lying', [ISC], [MOL], 'lying leg curl, leg curl couché, curl jambes allongé')
ex('Leg curl assis', 'Ischio-jambiers', 'machine', 'leg_curl_seated', [ISC], [MOL], 'seated leg curl, curl jambes assis')
ex('Soulevé de terre jambes tendues', 'Ischio-jambiers', 'barre', 'rdl', [ISC, FES], [LOMB, AVB], 'stiff leg deadlift, sdt jambes tendues, stiff legged deadlift, jambes tendues')
ex('Soulevé de terre roumain', 'Ischio-jambiers', 'barre', 'rdl', [ISC, FES], [LOMB, AVB], 'romanian deadlift, rdl, sdt roumain, roumain')
ex('Good morning', 'Ischio-jambiers', 'barre', 'good_morning', [ISC, LOMB], [FES], 'good morning, bonjour barre')

/* --------------------------------- Mollets --------------------------------- */
ex('Mollets debout', 'Mollets', 'machine', 'calf_standing', [MOL], [], 'standing calf raise, calf raise, mollets debout machine, extensions mollets')
ex('Mollets debout Smith', 'Mollets', 'smith', 'calf_standing', [MOL], [], 'smith calf raise, mollets smith machine')
ex('Mollets assis', 'Mollets', 'machine', 'calf_seated', [MOL], [], 'seated calf raise, mollets assis machine, soléaire')
ex('Mollets à la presse', 'Mollets', 'machine', 'calf_press', [MOL], [], 'leg press calf raise, calf press, mollets presse à cuisses')

/* --------------------------------- Fessiers --------------------------------- */
ex('Hip thrust', 'Fessiers', 'barre', 'hip_thrust', [FES], [ISC, QUAD], 'barbell hip thrust, hip thrust barre, poussée de hanches')
ex('Hip thrust Smith', 'Fessiers', 'smith', 'hip_thrust', [FES], [ISC, QUAD], 'smith hip thrust, hip thrust smith machine')
ex('Hip thrust machine', 'Fessiers', 'machine', 'hip_thrust', [FES], [ISC, QUAD], 'machine hip thrust, hip thrust guidé')
ex('Pont fessier', 'Fessiers', 'poids_du_corps', 'glute_bridge', [FES], [ISC], 'glute bridge, pont fessiers, bridge')
ex('Kickback fessier poulie', 'Fessiers', 'poulie', 'glute_kickback', [FES], [ISC], 'cable glute kickback, kickback poulie, extension de hanche poulie', true)
ex('Kickback fessier machine', 'Fessiers', 'machine', 'glute_kickback', [FES], [ISC], 'glute kickback machine, kickback machine, fessiers machine', true)
ex('Abducteurs machine', 'Fessiers', 'machine', 'abductor', [MFE], [FES], 'abductor machine, hip abduction, abduction machine, machine abducteurs, abduction')

/* ------------------------------- Abdominaux ------------------------------- */
ex('Crunch', 'Abdominaux', 'poids_du_corps', 'crunch', [ABS], [OBL], 'crunchs, abdos, sit up, crunch abdos')
ex('Crunch poulie haute', 'Abdominaux', 'poulie', 'cable_crunch', [ABS], [OBL], 'cable crunch, crunch à la poulie, abdos poulie')
ex('Relevé de jambes', 'Abdominaux', 'poids_du_corps', 'leg_raise_floor', [ABS], [OBL, QUAD], 'leg raise, relevé de jambes au sol, lying leg raise')
ex('Relevé de jambes suspendu', 'Abdominaux', 'poids_du_corps', 'hanging_leg_raise', [ABS], [OBL, AVB, QUAD], 'hanging leg raise, relevés de jambes barre, suspendu')
ex('Relevé de genoux suspendu', 'Abdominaux', 'poids_du_corps', 'knee_raise', [ABS], [OBL, AVB], 'hanging knee raise, relevé de genoux, chaise romaine')
ex('Gainage (planche)', 'Abdominaux', 'poids_du_corps', 'plank', [ABS], [OBL, DA, LOMB, FES], 'plank, planche, gainage, gainage ventral')
ex('Gainage latéral', 'Abdominaux', 'poids_du_corps', 'side_plank', [OBL], [ABS, MFE], 'side plank, planche latérale, gainage de côté')
ex('Russian twist', 'Abdominaux', 'poids_du_corps', 'russian_twist', [OBL], [ABS], 'russian twist, rotations russes, rotation buste')
ex('Roue abdominale', 'Abdominaux', 'poids_du_corps', 'ab_wheel', [ABS], [DA, LAT, LOMB], 'ab wheel, ab roller, roulette abdos')
ex('Machine abdos', 'Abdominaux', 'machine', 'ab_machine', [ABS], [OBL], 'ab crunch machine, abdominal machine, crunch machine')
ex('Bicyclette (abdos)', 'Abdominaux', 'poids_du_corps', 'bicycle', [ABS, OBL], [], 'bicycle crunch, crunch vélo, bicyclette')
ex('Woodchopper poulie', 'Abdominaux', 'poulie', 'woodchopper', [OBL], [ABS, DA], 'wood chop, cable chop, bûcheron, rotation poulie, woodchop')

/* ------------------------------- Avant-bras ------------------------------- */
ex('Curl poignets', 'Avant-bras', 'halteres', 'wrist_curl', [AVB], [], 'wrist curl, flexion poignets, curl poignet')
ex('Curl poignets inversé', 'Avant-bras', 'halteres', 'reverse_wrist', [AVB], [], 'reverse wrist curl, extension poignets, curl poignet inversé')
ex('Farmer’s walk', 'Avant-bras', 'halteres', 'farmers', [AVB, TRAP], [ABS, QUAD], 'farmer walk, marche du fermier, farmers walk, marche chargée')

/* ----------------------------------- Cardio ----------------------------------- */
ex('Rameur', 'Autre', 'machine', 'cardio_rower', [LAT, QUAD], [BI, ISC], 'rowing machine ergomètre, rower, concept2')
ex('Vélo', 'Autre', 'machine', 'cardio_bike', [QUAD], [MOL, ISC, FES], 'bike, vélo stationnaire, vélo elliptique, cardio vélo')
ex('Tapis de course', 'Autre', 'machine', 'cardio_treadmill', [QUAD, MOL], [ISC, FES], 'treadmill, course, running, tapis roulant')

export const EXERCISE_LIBRARY: readonly LibraryExercise[] = entries

/** Bump when entries are added/changed so installed apps sync them once. */
export const LIBRARY_VERSION = 1

export const LIBRARY_BY_SEED_ID: ReadonlyMap<string, LibraryExercise> = new Map(entries.map((e) => [e.seedId, e]))
