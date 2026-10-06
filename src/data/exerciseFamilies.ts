import type { Equipment } from '../types'

/**
 * Instructions are written once per movement ("family") and shared by every
 * equipment variant of it (barre, haltères, Smith, machine…). Each family is
 * 3-5 short steps (position, movement, breathing) and 2-3 common mistakes.
 */
export interface ExerciseFamily {
  steps: string[]
  tips: string[]
}

/** Extra note about the equipment itself, shown under the steps. */
export const EQUIPMENT_NOTES: Record<Equipment, string> = {
  barre: 'Barre libre : charge de façon symétrique, serre les colliers et demande un pareur pour les charges lourdes.',
  halteres: 'Haltères : choisis une charge que tu contrôles sur toute l’amplitude et repose-les doucement en fin de série.',
  ez: 'Barre EZ : les prises légèrement inclinées ménagent les poignets et les coudes.',
  machine:
    'Machine guidée : règle le siège et les poignées à ta taille avant de charger, pour que l’articulation travaillée soit alignée avec l’axe de la machine.',
  smith:
    'Smith machine : la barre est guidée sur des rails. Règle la hauteur, tourne les poignets pour la décrocher et raccroche-la en fin de série. Place les pieds un peu en avant ou en arrière selon l’exercice pour rester dans l’axe.',
  poulie: 'Poulie : choisis la bonne attache et garde le câble tendu pendant tout le mouvement, sans laisser la pile se reposer.',
  poids_du_corps: 'Poids du corps : privilégie des répétitions propres ; ajoute une charge ou une variante plus difficile quand c’est facile.',
}

export const FAMILIES: Record<string, ExerciseFamily> = {
  /* ------------------------------ Pectoraux ------------------------------ */
  press_flat: {
    steps: [
      'Allonge-toi sur le banc, pieds à plat, omoplates serrées l’une vers l’autre et poitrine sortie.',
      'Saisis la charge un peu plus large que les épaules et décroche-la, bras tendus au-dessus de la poitrine.',
      'Descends lentement vers le milieu de la poitrine, avant-bras verticaux (inspire).',
      'Pousse jusqu’à tendre les bras sans verrouiller violemment les coudes (expire).',
    ],
    tips: [
      'Garde les fesses et les épaules collées au banc.',
      'Ne fais pas rebondir la charge sur la poitrine.',
      'Coudes à environ 45-60° du corps, pas écartés à 90°.',
    ],
  },
  press_incline: {
    steps: [
      'Règle le banc entre 30° et 45° et cale ton dos, omoplates serrées, pieds bien ancrés.',
      'Saisis la charge à largeur d’épaules élargie et pousse-la au-dessus du haut de la poitrine.',
      'Descends lentement vers le haut des pectoraux, sous la clavicule (inspire).',
      'Repousse en tendant les bras sans décoller le dos du banc (expire).',
    ],
    tips: [
      'Au-delà de 45°, ce sont surtout les épaules qui travaillent.',
      'Contrôle la descente : 2 secondes environ.',
      'Ne cambre pas excessivement le bas du dos.',
    ],
  },
  press_decline: {
    steps: [
      'Cale-toi sur le banc décliné, jambes bloquées, dos plaqué, omoplates serrées.',
      'Saisis la charge à largeur d’épaules élargie et décroche-la, bras tendus.',
      'Descends vers le bas de la poitrine de façon contrôlée (inspire).',
      'Pousse pour revenir bras tendus (expire).',
    ],
    tips: [
      'Utilise un pareur : le déclin rend la récupération de la barre plus difficile.',
      'Ne reste pas la tête en bas trop longtemps entre les séries.',
      'Garde les poignets droits, dans l’axe des avant-bras.',
    ],
  },
  fly_flat: {
    steps: [
      'Allonge-toi sur le banc, un haltère dans chaque main, bras tendus au-dessus de la poitrine, paumes face à face.',
      'Ouvre les bras en arc de cercle, coudes légèrement fléchis, jusqu’à sentir l’étirement des pectoraux (inspire).',
      'Referme en ramenant les haltères l’un vers l’autre comme pour serrer un grand arbre (expire).',
    ],
    tips: [
      'Garde les coudes légèrement fléchis et fixes : ce n’est pas un développé.',
      'Ne descends pas les haltères sous la ligne des épaules.',
      'Prends plus léger que pour un développé.',
    ],
  },
  fly_incline: {
    steps: [
      'Règle le banc à 30° environ, un haltère dans chaque main au-dessus du haut de la poitrine.',
      'Ouvre les bras en arc, coudes légèrement fléchis, jusqu’à l’étirement des pectoraux (inspire).',
      'Ramène les haltères l’un vers l’autre en contractant le haut des pectoraux (expire).',
    ],
    tips: [
      'Mouvement lent, surtout à la descente.',
      'Ne laisse pas les épaules monter vers les oreilles.',
      'Choisis une charge modérée pour garder l’amplitude.',
    ],
  },
  cable_fly_high: {
    steps: [
      'Règle les poulies en position haute, saisis une poignée dans chaque main et avance d’un pas, buste légèrement penché.',
      'Bras ouverts, coudes légèrement fléchis, étire les pectoraux (inspire).',
      'Ramène les mains vers le bas, devant le bassin, en serrant les pectoraux (expire).',
    ],
    tips: [
      'Garde le buste stable, ne te sers pas de l’élan.',
      'Coudes toujours un peu fléchis, jamais verrouillés.',
      'Marque une courte pause quand les mains se rejoignent.',
    ],
  },
  cable_fly_low: {
    steps: [
      'Règle les poulies en position basse, saisis les poignées et avance d’un pas, buste droit.',
      'Bras ouverts le long du corps, coudes légèrement fléchis (inspire).',
      'Monte les mains en arc vers le haut de la poitrine en serrant les pectoraux (expire).',
    ],
    tips: [
      'Sollicite le haut des pectoraux : monte les mains vers le menton.',
      'Ne hausse pas les épaules.',
      'Contrôle le retour, sans laisser la pile claquer.',
    ],
  },
  pec_deck: {
    steps: [
      'Règle le siège pour que les poignées soient à hauteur de poitrine, dos bien calé.',
      'Saisis les poignées ou pose les avant-bras sur les coussins, coudes à hauteur des épaules.',
      'Rapproche les bras devant toi en serrant les pectoraux (expire).',
      'Reviens lentement en ouvrant jusqu’à sentir l’étirement, sans lâcher la pile (inspire).',
    ],
    tips: [
      'Garde les épaules basses et en arrière.',
      'Ne claque pas les poids entre les répétitions.',
      'Ne pousse pas avec les bras : pense à rapprocher les coudes.',
    ],
  },
  pushup: {
    steps: [
      'Mains au sol un peu plus larges que les épaules, corps gainé de la tête aux talons.',
      'Descends en fléchissant les coudes jusqu’à frôler le sol avec la poitrine (inspire).',
      'Repousse le sol pour revenir bras tendus (expire).',
    ],
    tips: [
      'Ne laisse pas le bassin s’affaisser ni monter.',
      'Coudes à environ 45° du corps.',
      'Trop dur ? Fais-les genoux au sol ou mains surélevées.',
    ],
  },
  chest_dips: {
    steps: [
      'Prends appui sur les barres parallèles, bras tendus, buste penché vers l’avant, jambes croisées derrière.',
      'Descends en fléchissant les coudes jusqu’à sentir l’étirement des pectoraux (inspire).',
      'Repousse jusqu’à tendre les bras en gardant le buste incliné (expire).',
    ],
    tips: [
      'Plus le buste est penché, plus les pectoraux travaillent.',
      'Ne descends pas plus bas que ce que tes épaules acceptent sans douleur.',
      'Évite de balancer les jambes.',
    ],
  },
  pullover_db: {
    steps: [
      'Allonge-toi en travers ou le long du banc, un haltère tenu à deux mains au-dessus de la poitrine.',
      'Descends l’haltère derrière la tête, bras presque tendus, jusqu’à l’étirement du buste (inspire).',
      'Ramène l’haltère au-dessus de la poitrine en gardant les bras quasi tendus (expire).',
    ],
    tips: [
      'Garde les côtes basses : ne cambre pas le dos.',
      'Amplitude confortable : arrête-toi si les épaules tirent.',
      'Charge modérée, mouvement lent.',
    ],
  },

  /* --------------------------------- Dos --------------------------------- */
  pullup: {
    steps: [
      'Suspends-toi à la barre, mains écartées à largeur d’épaules ou un peu plus, bras tendus.',
      'Tire les coudes vers le bas et amène le menton au-dessus de la barre (expire).',
      'Redescends lentement jusqu’à bras tendus (inspire).',
    ],
    tips: [
      'Commence le mouvement en abaissant les omoplates, pas en tirant avec les bras seuls.',
      'Évite de te balancer.',
      'Pas encore assez fort ? Utilise la machine assistée ou un élastique.',
    ],
  },
  pullup_assisted: {
    steps: [
      'Règle le contrepoids (plus la charge est lourde, plus la machine t’aide) et monte sur le support, genoux ou pieds posés.',
      'Saisis la barre, bras tendus, poitrine sortie.',
      'Tire les coudes vers le bas jusqu’à ce que le menton dépasse la barre (expire).',
      'Redescends lentement bras tendus (inspire).',
    ],
    tips: [
      'Diminue progressivement l’assistance au fil des semaines.',
      'Ne te laisse pas retomber : contrôle la descente.',
      'Garde les épaules loin des oreilles.',
    ],
  },
  lat_pulldown: {
    steps: [
      'Règle le coussin sur les cuisses et saisis la barre ; assieds-toi, buste légèrement incliné en arrière, poitrine sortie.',
      'Tire la barre vers le haut de la poitrine en menant avec les coudes (expire).',
      'Remonte lentement jusqu’à bras presque tendus pour étirer le dos (inspire).',
    ],
    tips: [
      'Ne tire pas derrière la nuque.',
      'Ne te penche pas trop en arrière pour tricher.',
      'Pense à « mettre les coudes dans les poches ».',
    ],
  },
  seated_row: {
    steps: [
      'Assieds-toi face à la poulie basse, pieds calés, genoux légèrement fléchis, dos droit.',
      'Tire la poignée vers le bas du ventre en serrant les omoplates (expire).',
      'Reviens lentement bras tendus en étirant le dos, sans arrondir (inspire).',
    ],
    tips: [
      'Le buste reste quasi immobile : ne balance pas d’avant en arrière.',
      'Garde les épaules basses.',
      'Marque une pause quand les omoplates sont serrées.',
    ],
  },
  barbell_row: {
    steps: [
      'Debout, pieds à largeur de bassin, penche le buste à environ 45°, dos plat, charge tenue bras tendus.',
      'Tire la charge vers le bas du ventre en menant avec les coudes (expire).',
      'Redescends en contrôlant, bras tendus (inspire).',
    ],
    tips: [
      'Garde le dos plat pendant tout le mouvement.',
      'Ne remonte pas le buste à chaque répétition.',
      'Reste sur une charge que tu contrôles sans élan.',
    ],
  },
  one_arm_row: {
    steps: [
      'Pose un genou et une main sur le banc, dos plat ; l’autre main tient l’haltère, bras tendu.',
      'Tire l’haltère vers la hanche en gardant le coude proche du corps (expire).',
      'Redescends lentement en étirant le dos (inspire). Fais toutes les répétitions puis change de côté.',
    ],
    tips: [
      'Ne tourne pas le buste pour monter l’haltère.',
      'Pense à tirer avec le coude, pas avec la main.',
      'Garde la nuque dans le prolongement du dos.',
    ],
  },
  machine_row: {
    steps: [
      'Règle le siège et le coussin pour que les poignées soient à hauteur du buste, poitrine bien calée.',
      'Saisis les poignées et tire-les vers toi en serrant les omoplates (expire).',
      'Reviens lentement jusqu’à l’étirement sans lâcher la tension (inspire).',
    ],
    tips: [
      'Ne décolle pas la poitrine du coussin.',
      'Garde les épaules basses, loin des oreilles.',
      'Ralentis le retour : c’est là que le dos travaille aussi.',
    ],
  },
  tbar_row: {
    steps: [
      'Place-toi à cheval sur la barre, penche le buste à 45°, dos plat, saisis la poignée.',
      'Tire la charge vers le haut du ventre en serrant les omoplates (expire).',
      'Redescends lentement bras tendus (inspire).',
    ],
    tips: [
      'Garde les genoux légèrement fléchis.',
      'Ne bouge pas le buste pour aider.',
      'Évite d’arrondir le bas du dos.',
    ],
  },
  straight_arm: {
    steps: [
      'Face à la poulie haute, saisis la barre ou la corde bras tendus, buste légèrement penché, dos droit.',
      'Abaisse les mains vers les cuisses en gardant les bras presque tendus (expire).',
      'Remonte lentement jusqu’à l’étirement du dos (inspire).',
    ],
    tips: [
      'Les coudes restent légèrement fléchis et fixes.',
      'Ne laisse pas le buste suivre le mouvement.',
      'Imagine « balayer » la charge avec le dos.',
    ],
  },
  back_ext: {
    steps: [
      'Cale les hanches sur le coussin du banc à 45°, chevilles bloquées, bras croisés sur la poitrine.',
      'Descends le buste en gardant le dos droit (inspire).',
      'Remonte jusqu’à aligner le corps, sans cambrer (expire).',
    ],
    tips: [
      'Ne dépasse pas la ligne du corps en haut du mouvement.',
      'Mouvement lent, sans à-coups.',
      'Tiens un disque contre la poitrine pour augmenter la difficulté.',
    ],
  },
  deadlift: {
    steps: [
      'Pieds à largeur de bassin, barre au-dessus du milieu des pieds, saisis-la mains à l’extérieur des jambes, dos plat.',
      'Gonfle le ventre, serre le dos, puis pousse le sol avec les jambes (expire en haut).',
      'Termine debout, hanches serrées, sans te pencher en arrière.',
      'Redescends en poussant les hanches en arrière, la barre près des jambes.',
    ],
    tips: [
      'Garde le dos plat du début à la fin.',
      'La barre reste collée aux jambes.',
      'Commence léger pour apprendre le geste.',
    ],
  },
  rdl: {
    steps: [
      'Debout, barre ou haltères devant les cuisses, jambes presque tendues, genoux légèrement fléchis.',
      'Pousse les fesses en arrière en gardant le dos plat et descends la charge le long des jambes (inspire).',
      'Dès que tu sens l’étirement derrière les cuisses, remonte en poussant les hanches vers l’avant (expire).',
    ],
    tips: [
      'Le mouvement vient des hanches, pas du dos.',
      'La charge reste très proche des jambes.',
      'Ne descends pas plus bas que ta souplesse le permet.',
    ],
  },
  shrug: {
    steps: [
      'Debout, bras tendus le long du corps, charge tenue de chaque côté ou devant les cuisses.',
      'Hausse les épaules verticalement vers les oreilles (expire).',
      'Marque une pause en haut puis redescends lentement (inspire).',
    ],
    tips: [
      'Ne fais pas de rotation des épaules.',
      'Garde les bras tendus : les trapèzes travaillent, pas les biceps.',
      'Regarde droit devant, nuque neutre.',
    ],
  },

  /* ------------------------------- Épaules ------------------------------- */
  ohp: {
    steps: [
      'Debout ou assis, dos droit, charge à hauteur des épaules, avant-bras verticaux, abdos serrés.',
      'Pousse la charge au-dessus de la tête jusqu’à tendre les bras (expire).',
      'Redescends lentement jusqu’aux épaules (inspire).',
    ],
    tips: [
      'Ne cambre pas le bas du dos : serre abdos et fessiers.',
      'Passe la tête légèrement en avant une fois la charge dépassée.',
      'Évite de pousser avec les jambes (sauf variante « push press »).',
    ],
  },
  arnold: {
    steps: [
      'Assis, haltères devant les épaules, paumes tournées vers toi, coudes devant.',
      'Pousse en ouvrant les coudes et en tournant les paumes vers l’avant pour terminer bras tendus (expire).',
      'Redescends en inversant la rotation jusqu’à la position de départ (inspire).',
    ],
    tips: [
      'Mouvement fluide, sans à-coups.',
      'Choisis des haltères plus légers que pour un développé classique.',
      'Garde le dos calé contre le dossier.',
    ],
  },
  lateral_raise: {
    steps: [
      'Debout, une charge dans chaque main le long du corps, coudes très légèrement fléchis.',
      'Monte les bras sur les côtés jusqu’à hauteur d’épaules (expire).',
      'Redescends lentement sans laisser tomber la charge (inspire).',
    ],
    tips: [
      'Mène avec les coudes, pas avec les mains.',
      'Ne monte pas au-dessus de la ligne des épaules.',
      'Évite de balancer le buste.',
    ],
  },
  front_raise: {
    steps: [
      'Debout, haltères ou barre devant les cuisses, bras presque tendus.',
      'Monte la charge devant toi jusqu’à hauteur des yeux (expire).',
      'Redescends lentement (inspire).',
    ],
    tips: [
      'Ne balance pas le buste.',
      'Reste sur des charges légères à modérées.',
      'Les épaules restent basses, loin des oreilles.',
    ],
  },
  rear_delt: {
    steps: [
      'Penche le buste vers l’avant, dos plat (ou assieds-toi face à la machine), charge dans les mains, bras presque tendus.',
      'Ouvre les bras sur les côtés en serrant les omoplates (expire).',
      'Reviens lentement à la position de départ (inspire).',
    ],
    tips: [
      'Coudes légèrement fléchis et fixes.',
      'Charge légère : les deltoïdes postérieurs sont petits.',
      'Ne soulève pas le buste pour aider.',
    ],
  },
  face_pull: {
    steps: [
      'Règle la poulie à hauteur du visage avec une corde, saisis-la paumes face à face et recule d’un pas.',
      'Tire la corde vers ton visage en ouvrant les coudes vers l’extérieur (expire).',
      'Reviens lentement bras tendus (inspire).',
    ],
    tips: [
      'Coudes à hauteur des mains ou plus haut.',
      'Garde une charge légère et un mouvement propre.',
      'Excellent pour la posture et la santé des épaules.',
    ],
  },
  upright_row: {
    steps: [
      'Debout, barre ou poulie devant les cuisses, prise à largeur d’épaules ou un peu plus.',
      'Monte la charge le long du corps jusqu’au milieu de la poitrine, coudes hauts (expire).',
      'Redescends lentement (inspire).',
    ],
    tips: [
      'Ne monte pas les coudes au-dessus des épaules si ça pince.',
      'Prise plus large = moins de contrainte sur les épaules.',
      'Garde le dos droit.',
    ],
  },

  /* ------------------------------- Biceps ------------------------------- */
  curl: {
    steps: [
      'Debout, charge en mains, paumes vers l’avant, coudes collés au corps.',
      'Fléchis les coudes pour monter la charge vers les épaules (expire).',
      'Redescends lentement jusqu’à bras tendus (inspire).',
    ],
    tips: [
      'Ne balance pas le buste pour monter la charge.',
      'Les coudes restent immobiles le long du corps.',
      'Descends complètement pour travailler toute l’amplitude.',
    ],
  },
  hammer: {
    steps: [
      'Debout, un haltère dans chaque main, paumes face aux cuisses (prise neutre), coudes au corps.',
      'Monte les haltères vers les épaules sans tourner les poignets (expire).',
      'Redescends lentement (inspire).',
    ],
    tips: [
      'Poignets droits tout le long.',
      'Ne balance pas le buste.',
      'Peut se faire en alternant les bras.',
    ],
  },
  incline_curl: {
    steps: [
      'Assieds-toi sur un banc incliné à 45-60°, dos calé, bras pendants de chaque côté avec un haltère.',
      'Monte les haltères en fléchissant les coudes sans les avancer (expire).',
      'Redescends lentement jusqu’à l’étirement complet du biceps (inspire).',
    ],
    tips: [
      'Garde les coudes sous les épaules.',
      'Charge modérée : l’étirement rend l’exercice exigeant.',
      'Ne décolle pas les épaules du dossier.',
    ],
  },
  preacher: {
    steps: [
      'Assieds-toi au pupitre, bras posés à plat sur le coussin, poitrine contre le support, saisis la charge.',
      'Monte la charge vers les épaules sans décoller les bras du coussin (expire).',
      'Redescends lentement presque à bras tendus (inspire).',
    ],
    tips: [
      'Ne verrouille pas brusquement les coudes en bas.',
      'N’utilise pas l’élan : mouvement lent.',
      'Règle le siège pour que les aisselles soient calées en haut du coussin.',
    ],
  },
  cable_curl: {
    steps: [
      'Face à la poulie basse, saisis la barre ou la corde, coudes collés au corps.',
      'Fléchis les coudes pour monter vers les épaules (expire).',
      'Redescends lentement en gardant le câble tendu (inspire).',
    ],
    tips: [
      'La tension est constante grâce à la poulie : ne la relâche pas en bas.',
      'Ne penche pas le buste en arrière.',
      'Garde les poignets droits.',
    ],
  },
  concentration: {
    steps: [
      'Assis sur un banc, coude appuyé contre l’intérieur de la cuisse, haltère en main, bras tendu.',
      'Monte l’haltère vers l’épaule en tournant légèrement le poignet (expire).',
      'Redescends lentement jusqu’à bras tendu (inspire). Fais toutes les répétitions puis change de bras.',
    ],
    tips: [
      'Le bras reste immobile, seul l’avant-bras bouge.',
      'Pause d’une seconde en haut pour bien contracter.',
      'Ne penche pas le buste pour tricher.',
    ],
  },

  /* ------------------------------- Triceps ------------------------------- */
  pushdown: {
    steps: [
      'Face à la poulie haute, saisis la corde ou la barre, coudes collés au corps, avant-bras à l’horizontale.',
      'Pousse vers le bas jusqu’à tendre complètement les bras (expire).',
      'Remonte lentement jusqu’à ce que les avant-bras reviennent à l’horizontale (inspire).',
    ],
    tips: [
      'Les coudes ne bougent pas : seuls les avant-bras travaillent.',
      'Avec la corde, écarte les mains en bas pour accentuer la contraction.',
      'Ne te penche pas sur la barre pour pousser.',
    ],
  },
  skullcrusher: {
    steps: [
      'Allonge-toi sur le banc, barre EZ ou haltères au-dessus de la poitrine, bras tendus.',
      'Fléchis les coudes pour descendre la charge vers le front ou derrière la tête (inspire).',
      'Tends les bras pour revenir en haut, coudes fixes (expire).',
    ],
    tips: [
      'Les coudes pointent vers le plafond, sans s’écarter.',
      'Contrôle la descente pour protéger les coudes.',
      'Commence par une charge légère.',
    ],
  },
  overhead_ext: {
    steps: [
      'Debout ou assis, tiens un haltère à deux mains au-dessus de la tête, bras tendus.',
      'Fléchis les coudes pour descendre l’haltère derrière la tête (inspire).',
      'Tends les bras pour remonter, coudes près des oreilles (expire).',
    ],
    tips: [
      'Garde les coudes serrés, pas écartés.',
      'Ne cambre pas le dos : abdos serrés.',
      'Mouvement lent et contrôlé.',
    ],
  },
  close_grip: {
    steps: [
      'Allonge-toi sur le banc, saisis la barre mains écartées d’environ la largeur des épaules.',
      'Descends la barre vers le bas de la poitrine, coudes près du corps (inspire).',
      'Repousse jusqu’à tendre les bras en gardant les coudes serrés (expire).',
    ],
    tips: [
      'Ne rapproche pas trop les mains : les poignets souffrent.',
      'Les coudes restent proches du corps.',
      'Garde les omoplates serrées sur le banc.',
    ],
  },
  bench_dips: {
    steps: [
      'Mains posées sur le bord d’un banc derrière toi, jambes tendues ou fléchies devant toi.',
      'Descends en fléchissant les coudes jusqu’à environ 90° (inspire).',
      'Repousse jusqu’à tendre les bras (expire).',
    ],
    tips: [
      'Garde le dos près du banc.',
      'Ne descends pas trop bas si les épaules tirent.',
      'Plie les genoux pour faciliter, ajoute un poids sur les cuisses pour durcir.',
    ],
  },
  kickback: {
    steps: [
      'Penche le buste, dos plat, coude plié à 90° collé au corps, haltère en main.',
      'Tends le bras vers l’arrière jusqu’à l’aligner avec le dos (expire).',
      'Reviens lentement à 90° (inspire). Change de bras après la série.',
    ],
    tips: [
      'Le haut du bras reste immobile.',
      'Charge légère, contraction maximale en haut.',
      'Ne balance pas le buste.',
    ],
  },
  tri_machine: {
    steps: [
      'Règle le siège pour que les coudes soient alignés avec l’axe de la machine, dos calé.',
      'Pousse les poignées ou le levier jusqu’à tendre les bras (expire).',
      'Reviens lentement jusqu’à ce que les avant-bras remontent (inspire).',
    ],
    tips: [
      'Garde les coudes près du corps.',
      'Ne décolle pas le dos du dossier.',
      'Mouvement lent, sans verrouiller brutalement les coudes.',
    ],
  },

  bar_dips_triceps: {
    steps: [
      'Prends appui sur les barres parallèles, bras tendus, buste bien droit, jambes croisées derrière.',
      'Descends en fléchissant les coudes, serrés le long du corps, jusqu’à environ 90° (inspire).',
      'Repousse jusqu’à tendre les bras sans balancer (expire).',
    ],
    tips: [
      'Garde le buste vertical pour cibler les triceps.',
      'Ne laisse pas les épaules monter vers les oreilles.',
      'Ajoute du lest seulement quand 12 répétitions propres sont faciles.',
    ],
  },
  leg_raise_floor: {
    steps: [
      'Allonge-toi sur le dos, mains sous les fesses ou le long du corps, jambes tendues.',
      'Monte les jambes jusqu’à la verticale en gardant le bas du dos plaqué au sol (expire).',
      'Redescends lentement sans toucher le sol (inspire).',
    ],
    tips: [
      'Si le bas du dos se cambre, fléchis les genoux.',
      'Mouvement lent, surtout à la descente.',
      'Respire sans bloquer.',
    ],
  },

  /* ------------------------------- Jambes ------------------------------- */
  squat: {
    steps: [
      'Pieds à largeur d’épaules, pointes légèrement ouvertes, charge stable sur le haut du dos, abdos serrés.',
      'Descends en poussant les fesses en arrière et en fléchissant les genoux, dos droit (inspire).',
      'Descends au moins jusqu’à ce que les cuisses soient parallèles au sol.',
      'Pousse dans les talons et le milieu du pied pour remonter (expire).',
    ],
    tips: [
      'Les genoux suivent la direction des pieds, sans rentrer vers l’intérieur.',
      'Garde le regard devant et le dos plat.',
      'Les talons restent au sol.',
    ],
  },
  front_squat: {
    steps: [
      'Barre posée sur l’avant des épaules, coudes hauts, pieds à largeur d’épaules.',
      'Descends en gardant le buste très droit et les coudes hauts (inspire).',
      'Remonte en poussant dans les pieds (expire).',
    ],
    tips: [
      'Si les coudes tombent, la barre roule : allège la charge.',
      'Mobilité des poignets et des chevilles nécessaire : progresse doucement.',
      'Garde les genoux dans l’axe des pieds.',
    ],
  },
  goblet: {
    steps: [
      'Tiens un haltère verticalement contre la poitrine, pieds un peu plus larges que les épaules.',
      'Descends entre les jambes en gardant le buste droit, coudes à l’intérieur des genoux (inspire).',
      'Remonte en poussant dans les pieds (expire).',
    ],
    tips: [
      'Excellent exercice pour apprendre le squat.',
      'Garde les talons au sol.',
      'Le haltère reste collé à la poitrine.',
    ],
  },
  leg_press: {
    steps: [
      'Assieds-toi, dos et bassin bien calés, pieds à largeur d’épaules au milieu de la plateforme.',
      'Décroche les sécurités et descends en fléchissant les genoux jusqu’à environ 90° (inspire).',
      'Pousse avec tout le pied pour tendre les jambes sans verrouiller les genoux (expire).',
    ],
    tips: [
      'Ne décolle pas le bassin du siège en bas du mouvement.',
      'Les genoux suivent la direction des pieds.',
      'Pieds hauts = plus de fessiers et d’ischios ; pieds bas = plus de quadriceps.',
    ],
  },
  hack_squat: {
    steps: [
      'Place les épaules sous les coussins, dos plaqué, pieds à largeur d’épaules sur la plateforme.',
      'Décroche et descends en fléchissant les genoux jusqu’à environ 90° (inspire).',
      'Pousse dans les pieds pour remonter (expire).',
    ],
    tips: [
      'Garde tout le dos contre le dossier.',
      'Ne verrouille pas les genoux en haut.',
      'Pieds plus bas pour cibler davantage les quadriceps.',
    ],
  },
  leg_ext: {
    steps: [
      'Règle le dossier et le rouleau pour qu’il soit sur le bas des tibias, genoux alignés avec l’axe.',
      'Tends les jambes jusqu’à les aligner (expire).',
      'Redescends lentement sans reposer la pile (inspire).',
    ],
    tips: [
      'Ne balance pas le buste.',
      'Marque une pause en haut pour contracter les quadriceps.',
      'Charge raisonnable : les genoux n’aiment pas les à-coups.',
    ],
  },
  leg_curl_lying: {
    steps: [
      'Allonge-toi sur le ventre, rouleau juste au-dessus des talons, genoux alignés avec l’axe.',
      'Fléchis les jambes pour ramener les talons vers les fesses (expire).',
      'Redescends lentement jusqu’à presque tendre les jambes (inspire).',
    ],
    tips: [
      'Garde les hanches collées au banc.',
      'Ne cambre pas le dos.',
      'Contrôle la phase de retour.',
    ],
  },
  leg_curl_seated: {
    steps: [
      'Assieds-toi, dos calé, coussin sur les cuisses, rouleau derrière les chevilles.',
      'Fléchis les jambes en tirant les talons vers le bas et l’arrière (expire).',
      'Reviens lentement jambes tendues (inspire).',
    ],
    tips: [
      'Règle le coussin pour bien bloquer les cuisses.',
      'Ne décolle pas les fesses du siège.',
      'Garde un rythme lent.',
    ],
  },
  lunge: {
    steps: [
      'Debout, charge en mains ou sur le dos, un grand pas en avant.',
      'Descends en fléchissant les deux genoux jusqu’à ce que le genou arrière frôle le sol (inspire).',
      'Pousse dans la jambe avant pour revenir debout (expire).',
    ],
    tips: [
      'Buste droit, bassin stable.',
      'Le genou avant ne rentre pas vers l’intérieur.',
      'Pense à descendre à la verticale, pas vers l’avant.',
    ],
  },
  walking_lunge: {
    steps: [
      'Debout, une charge dans chaque main, fais un grand pas en avant.',
      'Descends jusqu’à ce que le genou arrière frôle le sol (inspire).',
      'Pousse sur la jambe avant et amène la jambe arrière devant pour enchaîner le pas suivant (expire).',
    ],
    tips: [
      'Regarde droit devant, buste droit.',
      'Fais des pas assez longs pour que le genou avant reste au-dessus du pied.',
      'Prends de l’espace : une dizaine de mètres.',
    ],
  },
  bulgarian: {
    steps: [
      'Place le pied arrière sur un banc derrière toi, l’autre jambe devant, charge en mains.',
      'Descends en fléchissant la jambe avant jusqu’à ce que la cuisse soit parallèle au sol (inspire).',
      'Pousse dans le pied avant pour remonter (expire). Change de jambe après la série.',
    ],
    tips: [
      'Place le pied avant assez loin pour que le genou reste au-dessus de la cheville.',
      'Buste droit.',
      'Commence sans charge pour trouver ton équilibre.',
    ],
  },
  good_morning: {
    steps: [
      'Barre sur le haut du dos, pieds à largeur d’épaules, genoux légèrement fléchis.',
      'Penche le buste en poussant les fesses en arrière, dos plat, jusqu’à être presque parallèle au sol (inspire).',
      'Remonte en poussant les hanches vers l’avant (expire).',
    ],
    tips: [
      'Commence très léger : c’est un exercice technique.',
      'Le dos reste plat, jamais arrondi.',
      'Le mouvement vient des hanches.',
    ],
  },
  step_up: {
    steps: [
      'Face à un banc ou une marche, un pied posé dessus, charge en mains.',
      'Pousse dans la jambe posée pour monter jusqu’à être debout sur le banc (expire).',
      'Redescends lentement avec contrôle (inspire). Change de jambe après la série.',
    ],
    tips: [
      'N’utilise pas l’élan de la jambe du sol.',
      'Choisis un banc à hauteur du genou environ.',
      'Garde le buste droit.',
    ],
  },
  calf_standing: {
    steps: [
      'Debout, épaules sous les coussins ou barre sur le dos, pointes de pieds sur le bord de la plateforme.',
      'Descends les talons pour étirer les mollets (inspire).',
      'Monte sur la pointe des pieds le plus haut possible (expire) et marque une pause.',
    ],
    tips: [
      'Amplitude complète : étirement en bas, contraction en haut.',
      'Mouvement lent, sans rebond.',
      'Jambes tendues mais genoux non verrouillés.',
    ],
  },
  calf_seated: {
    steps: [
      'Assieds-toi, genoux sous les coussins, pointes de pieds sur la plateforme.',
      'Descends les talons pour étirer (inspire).',
      'Monte sur les pointes en contractant fort (expire), pause en haut.',
    ],
    tips: [
      'Cible surtout le soléaire, sous le mollet visible.',
      'Mouvement lent et complet.',
      'Utilise des charges plus lourdes que debout : les répétitions longues marchent bien.',
    ],
  },
  calf_press: {
    steps: [
      'Installe-toi sur la presse à cuisses, jambes presque tendues, pointes de pieds en bas de la plateforme.',
      'Descends les talons pour étirer les mollets (inspire).',
      'Pousse sur la pointe des pieds pour monter (expire), pause en haut.',
    ],
    tips: [
      'Les genoux restent quasi tendus, sans les verrouiller.',
      'N’utilise que les chevilles pour bouger.',
      'Contrôle la charge en bas.',
    ],
  },
  adductor: {
    steps: [
      'Assieds-toi, dos calé, cuisses ouvertes, coussins contre l’intérieur des genoux.',
      'Rapproche les jambes l’une de l’autre en serrant (expire).',
      'Reviens lentement en ouvrant (inspire).',
    ],
    tips: [
      'Ne laisse pas la pile claquer.',
      'Règle l’ouverture de départ à une amplitude confortable.',
      'Garde le dos plaqué.',
    ],
  },
  abductor: {
    steps: [
      'Assieds-toi, dos calé, jambes jointes, coussins contre l’extérieur des genoux.',
      'Ouvre les jambes en poussant vers l’extérieur (expire).',
      'Reviens lentement en contrôlant (inspire).',
    ],
    tips: [
      'Penche légèrement le buste en avant pour mieux cibler les fessiers.',
      'Garde le bassin stable.',
      'Fais une courte pause quand les jambes sont ouvertes.',
    ],
  },

  /* ------------------------------- Fessiers ------------------------------- */
  hip_thrust: {
    steps: [
      'Assieds-toi au sol, haut du dos contre un banc, charge posée sur le bassin, pieds à plat à largeur de hanches.',
      'Pousse dans les pieds et monte le bassin jusqu’à aligner épaules, hanches et genoux (expire).',
      'Contracte les fessiers en haut puis redescends lentement (inspire).',
    ],
    tips: [
      'Menton rentré, regard vers l’avant.',
      'Ne cambre pas le bas du dos en haut : bassin « enroulé ».',
      'Les tibias sont verticaux en haut du mouvement.',
    ],
  },
  glute_bridge: {
    steps: [
      'Allonge-toi sur le dos, genoux fléchis, pieds à plat près des fesses.',
      'Monte le bassin en poussant dans les talons jusqu’à aligner épaules, hanches et genoux (expire).',
      'Serre les fessiers puis redescends lentement (inspire).',
    ],
    tips: [
      'Ne cambre pas le bas du dos.',
      'Pousse avec les talons, pas les orteils.',
      'Ajoute un haltère sur le bassin pour progresser.',
    ],
  },
  glute_kickback: {
    steps: [
      'En appui devant la poulie basse (sangle à la cheville) ou sur la machine, buste légèrement penché.',
      'Pousse la jambe en arrière en serrant le fessier (expire).',
      'Reviens lentement sans lâcher la tension (inspire). Change de jambe après la série.',
    ],
    tips: [
      'Ne cambre pas le dos pour monter la jambe plus haut.',
      'Garde le bassin face au sol.',
      'Contracte fort en haut du mouvement.',
    ],
  },

  /* ------------------------------ Abdominaux ------------------------------ */
  crunch: {
    steps: [
      'Allonge-toi sur le dos, genoux fléchis, pieds au sol, mains près des tempes.',
      'Enroule le haut du dos pour décoller les épaules en soufflant (expire).',
      'Redescends lentement sans reposer complètement la tête (inspire).',
    ],
    tips: [
      'Ne tire pas sur la nuque avec les mains.',
      'Pense à rapprocher les côtes du bassin.',
      'Mouvement court mais contrôlé.',
    ],
  },
  cable_crunch: {
    steps: [
      'À genoux face à la poulie haute, corde tenue de chaque côté de la tête.',
      'Enroule le buste vers le bas en rapprochant les coudes des genoux (expire).',
      'Remonte lentement en gardant la tension (inspire).',
    ],
    tips: [
      'Les hanches restent fixes : le mouvement vient du buste.',
      'Arrondis le dos, ne plie pas seulement les hanches.',
      'Charge modérée pour rester propre.',
    ],
  },
  hanging_leg_raise: {
    steps: [
      'Suspends-toi à la barre, bras tendus, jambes tendues ou légèrement fléchies.',
      'Monte les jambes jusqu’à l’horizontale ou plus haut en enroulant le bassin (expire).',
      'Redescends lentement sans te balancer (inspire).',
    ],
    tips: [
      'Évite l’élan : stabilise le haut du corps.',
      'Enroule le bassin à la fin du mouvement pour travailler les abdos.',
      'Trop dur ? Fléchis les genoux.',
    ],
  },
  knee_raise: {
    steps: [
      'Suspends-toi à la barre ou appuie-toi sur la chaise romaine, dos plaqué.',
      'Monte les genoux vers la poitrine en enroulant le bassin (expire).',
      'Redescends lentement (inspire).',
    ],
    tips: [
      'Ne te balance pas.',
      'Pause d’une seconde en haut.',
      'Garde les épaules loin des oreilles.',
    ],
  },
  plank: {
    steps: [
      'En appui sur les avant-bras et les pointes de pieds, coudes sous les épaules.',
      'Aligne la tête, le dos et les jambes, abdos et fessiers serrés.',
      'Tiens la position en respirant normalement.',
    ],
    tips: [
      'Ne laisse pas le bassin s’affaisser ni monter.',
      'Regarde le sol, nuque neutre.',
      'Commence par 20 à 30 secondes et progresse.',
    ],
  },
  side_plank: {
    steps: [
      'Allonge-toi sur le côté, appuyé sur un avant-bras, coude sous l’épaule, jambes tendues.',
      'Soulève le bassin pour aligner la tête, le tronc et les jambes.',
      'Tiens la position en respirant, puis change de côté.',
    ],
    tips: [
      'Garde le bassin haut, sans le laisser tomber.',
      'Facilite en posant le genou au sol.',
      'Ne tourne pas le buste vers l’avant ou l’arrière.',
    ],
  },
  russian_twist: {
    steps: [
      'Assieds-toi, genoux fléchis, buste incliné en arrière, pieds au sol ou décollés, mains jointes (ou un poids).',
      'Tourne le buste d’un côté en amenant les mains près de la hanche (expire).',
      'Reviens au centre puis tourne de l’autre côté.',
    ],
    tips: [
      'Garde le dos droit, ne t’arrondis pas.',
      'Tourne avec le buste, pas seulement les bras.',
      'Pieds au sol pour faciliter.',
    ],
  },
  ab_wheel: {
    steps: [
      'À genoux, tiens la roue à deux mains sous les épaules, dos légèrement arrondi.',
      'Roule vers l’avant en gardant le ventre gainé jusqu’à ce que le buste soit presque à l’horizontale (inspire).',
      'Ramène la roue vers les genoux en contractant les abdos (expire).',
    ],
    tips: [
      'N’avance que jusqu’où tu peux garder le bas du dos plat.',
      'Ne cambre jamais.',
      'Commence avec une courte amplitude, contre un mur si besoin.',
    ],
  },
  ab_machine: {
    steps: [
      'Règle le siège et le coussin, saisis les poignées, dos calé.',
      'Enroule le buste vers l’avant en contractant les abdos (expire).',
      'Reviens lentement à la position de départ (inspire).',
    ],
    tips: [
      'Ne tire pas avec les bras : pense à rapprocher les côtes du bassin.',
      'Mouvement lent, sans élan.',
      'Garde le bassin calé sur le siège.',
    ],
  },
  bicycle: {
    steps: [
      'Allonge-toi sur le dos, mains près des tempes, jambes décollées.',
      'Amène un coude vers le genou opposé en étendant l’autre jambe (expire).',
      'Alterne de côté dans un mouvement de pédalage.',
    ],
    tips: [
      'Tourne le buste, pas seulement les coudes.',
      'Garde le bas du dos au sol.',
      'Rythme lent et contrôlé.',
    ],
  },
  woodchopper: {
    steps: [
      'Debout de profil à la poulie haute, saisis la poignée à deux mains, pieds à largeur de bassin.',
      'Tire en diagonale vers le bas, de l’épaule haute vers la hanche opposée, en pivotant le buste (expire).',
      'Reviens lentement à la position de départ (inspire). Change de côté après la série.',
    ],
    tips: [
      'Les bras restent presque tendus : le mouvement vient du tronc.',
      'Pivote sur les pieds, hanches stables.',
      'Charge modérée.',
    ],
  },

  /* ------------------------------ Avant-bras ------------------------------ */
  wrist_curl: {
    steps: [
      'Assis, avant-bras posés sur les cuisses ou un banc, paumes vers le haut, charge au bout des doigts.',
      'Fléchis les poignets pour monter la charge (expire).',
      'Redescends lentement en laissant la barre rouler jusqu’aux doigts (inspire).',
    ],
    tips: [
      'Les avant-bras restent à plat.',
      'Charge légère, répétitions nombreuses.',
      'Amplitude complète sans à-coups.',
    ],
  },
  reverse_wrist: {
    steps: [
      'Assis, avant-bras posés sur les cuisses ou un banc, paumes vers le bas, charge en main.',
      'Relève les poignets pour monter la charge (expire).',
      'Redescends lentement (inspire).',
    ],
    tips: [
      'Choisis une charge très légère : ces muscles sont petits.',
      'Les avant-bras ne bougent pas.',
      'Ne triche pas avec les coudes.',
    ],
  },
  farmers: {
    steps: [
      'Tiens un haltère lourd dans chaque main, bras le long du corps, épaules basses.',
      'Marche d’un pas régulier, buste droit, regard devant.',
      'Continue pendant la durée ou la distance prévue, puis repose les charges sous contrôle.',
    ],
    tips: [
      'Serre les poignées au maximum.',
      'Ne penche pas le buste d’un côté.',
      'Fais des petits pas réguliers.',
    ],
  },

  /* -------------------------------- Cardio -------------------------------- */
  cardio_rower: {
    steps: [
      'Assieds-toi, pieds sanglés, saisis la poignée bras tendus.',
      'Pousse avec les jambes, puis bascule le buste en arrière, puis tire la poignée vers le ventre.',
      'Reviens en inversant : bras, buste, puis jambes.',
    ],
    tips: [
      'Les jambes font l’essentiel du travail.',
      'Garde le dos droit.',
      'Cadence régulière.',
    ],
  },
  cardio_bike: {
    steps: [
      'Règle la selle pour que la jambe soit presque tendue en bas de la pédale.',
      'Pédale à une cadence régulière, dos droit, mains détendues.',
      'Ajuste la résistance selon l’intensité visée.',
    ],
    tips: [
      'Ne bloque pas les épaules.',
      'Respire de façon régulière.',
      'Échauffe-toi quelques minutes avant d’augmenter la résistance.',
    ],
  },
  cardio_treadmill: {
    steps: [
      'Monte sur le tapis, accroche le cordon de sécurité et démarre à faible vitesse.',
      'Augmente progressivement jusqu’à ton allure, buste droit, regard devant.',
      'Réduis la vitesse en fin de séance pour récupérer.',
    ],
    tips: [
      'Évite de te tenir aux barres en courant.',
      'Atterris sous le centre de gravité, pas trop loin devant.',
      'Garde une respiration régulière.',
    ],
  },
}
